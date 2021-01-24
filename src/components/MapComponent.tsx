/**
 * <MapComponent>: encapsulates Leaflet map.
 * Note that Leaflet component cannot render on server-side, and thus this component cannot either.
 * It must be stubbed out for SSR, which is done in <MapView> and <MiniMapView>.
 */
import React, {useRef, useState, Fragment} from 'react';
import L, {LeafletMouseEvent} from 'leaflet';
import {GeoJSON, Map, ScaleControl, TileLayer, Viewport} from 'react-leaflet';
import 'proj4leaflet';
import {FeatureCollection} from 'geojson';
import {ICONS} from './icons';

const MAP_SIDE_PANE_MIN_VIEWPORT_WIDTH = 768;
const MAP_SIDE_PANE_WIDTH_PERCENT = 33;

export interface MapComponentProps {
    lang: string;
    fullscreen: boolean;
    popups?: boolean;
    centerLat: number;
    centerLng: number;
    zoom: number;
    minZoom: number;
    maxZoom: number;
    mapSource: string;
    mapSubdomains?: string[];
    mapAttribution: string;
    pois: FeatureCollection[];
    subPois: FeatureCollection[] | undefined;
    onMove?: (centerLat: number, centerLng: number, zoom: number) => void;
    onPoiSelect?: (name: string, title: string) => void;
    onPoiDeselect?: () => void;
}

interface MapComponentState {
    initialized: boolean;
}

/**
 * Finnish coordinate system for using Finnish open data map raster layers.
 * Copied from https://dev.solita.fi/2017/12/12/gis-coordinate-systems.html
 * I honestly have no idea what it actually does
 */
const getCRStm35 = () => {
    let bounds, crsName, crsOpts, originNw, projDef, zoomLevels;
    zoomLevels = [8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25];
    crsName = 'EPSG:3067';
    projDef = '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
    bounds = L.bounds(L.point(-548576, 6291456), L.point(1548576, 8388608));
    originNw = L.point(bounds.min!.x, bounds.max!.y);
    crsOpts = {
        resolutions: zoomLevels,
        bounds: bounds,
        transformation: new L.Transformation(1, -originNw.x, -1, originNw.y)
    };
    return new L.Proj.CRS(crsName, projDef, crsOpts);
}
const crs = getCRStm35();

const icons: { [type: string]: L.Icon } = {};

export const MapComponent = (props: MapComponentProps) => {
    const mapRef: any = useRef<Map>();  // FIXME: type?
    const poiRefs: any[] = [];  // FIXME: type?
    for (let k = 0; k < 16; k++) {
        poiRefs.push(useRef<GeoJSON>()!);
    }
    const subpoiRef: any = useRef<GeoJSON>();  // FIXME: type?
    const [state, setState] = useState<MapComponentState>({initialized: false});
    const {lang, fullscreen, popups, centerLat, zoom, mapSource, minZoom, maxZoom,
        mapAttribution, mapSubdomains, pois, subPois, onMove, onPoiSelect, onPoiDeselect} = props;
    let {centerLng} = props;

    const shiftForOverlay = fullscreen && window.innerWidth >= MAP_SIDE_PANE_MIN_VIEWPORT_WIDTH;
    if (mapRef.current && mapRef.current.leafletElement && shiftForOverlay) {
        const leafletMap = mapRef.current.leafletElement;
        // for desktop view we have overlay pane to the right, so need to shift the map a bit
        const targetPoint = leafletMap.project([centerLat, centerLng], zoom).add([window.innerWidth / (100 / MAP_SIDE_PANE_WIDTH_PERCENT * 2), 0]);
        const targetLatLng = leafletMap.unproject(targetPoint, zoom);
        centerLng = targetLatLng.lng;
    }

    const handleMarkerClick = (e: LeafletMouseEvent) => {
        if (onPoiSelect) {
            onPoiSelect(e.target.feature.id, e.target.feature.properties.title);
        }
    }

    return <Fragment>
        <Map
            crs={crs}
            zoom={zoom}
            center={{lat: centerLat, lng: centerLng}}
            onclick={() => {
                if (onPoiDeselect) {
                    onPoiDeselect();
                }
            }}
            onViewportChanged={({center, zoom}: Viewport) => {
                // for desktop view we have overlay pane to the right, so need to shift the map a bit
                if (mapRef.current && mapRef.current.leafletElement && shiftForOverlay) {
                    const leafletMap = mapRef.current.leafletElement;
                    const targetPoint = leafletMap.project(center!, zoom!).subtract([window.innerWidth / (100 / MAP_SIDE_PANE_WIDTH_PERCENT * 2), 0]);
                    const targetLatLng = leafletMap.unproject(targetPoint, zoom!);
                    center![1] = targetLatLng.lng;
                }
                // update layers
                for (let k = 0; k < 16; k++) {
                    if (poiRefs[k].current && poiRefs[k].current.leafletElement && mapRef.current && mapRef.current.leafletElement) {
                        const leafletMap = mapRef.current.leafletElement, layer = poiRefs[k].current.leafletElement;
                        if (leafletMap.hasLayer(layer) && zoom! < k) {
                            leafletMap.removeLayer(layer);
                        } else if (!leafletMap.hasLayer(layer) && zoom! >= k) {
                            leafletMap.addLayer(layer);
                        }
                    }
                }
                // event handler
                if (onMove) {
                    onMove(center![0], center![1], zoom!)
                }
            }}
            ref={mapRef}
            whenReady={() => {
                setState({...state, initialized: true})
            }}
        >
            <TileLayer
                url={mapSource}
                subdomains={mapSubdomains}
                tms={true}
                minZoom={minZoom}
                maxZoom={maxZoom}
                attribution={mapAttribution}
            />
            <ScaleControl metric={true}/>
            {pois.map((data, k) => {
                if (!data.features.length) {
                    return null;
                }
                return <GeoJSON data={data} key={k} ref={poiRefs[k]} pointToLayer={(geoJsonPoint, latlng) => {
                    const marker = new L.Marker(latlng, {
                        icon: geoJsonPoint.properties.customIcon
                            ? new L.Icon({
                                iconUrl: geoJsonPoint.properties.customIcon,
                                iconSize: geoJsonPoint.properties.customIconSize || [50, 50],
                                className: 'custom-icon',
                            })
                            : ICONS[geoJsonPoint.properties.type],
                    });
                    if (onPoiSelect) {
                        marker.on('click' as any, handleMarkerClick);
                    }
                    return marker;
                }} onEachFeature={(feature, layer) => {
                    if (popups) {
                        layer.bindPopup(`<h4><a href="/${lang}/place/${feature.id}/">${feature.properties.title}</a></h4>`);
                    }
                }}/>
            })}
            {subPois && <GeoJSON data={subPois} ref={subpoiRef} pointToLayer={(geoJsonPoint, latlng) => {
                const marker = new L.Marker(latlng, {
                    icon: geoJsonPoint.properties.customIcon
                        ? new L.Icon({
                            iconUrl: geoJsonPoint.properties.customIcon,
                            iconSize: geoJsonPoint.properties.customIconSize || [50, 50],
                            className: 'custom-icon',
                        })
                        : ICONS[geoJsonPoint.properties.type],
                });
                if (onPoiSelect) {
                    marker.on('click' as any, handleMarkerClick);
                }
                return marker;
            }} onEachFeature={(feature, layer) => {
                if (popups) {
                    layer.bindPopup(`<h4><a href="/${lang}/place/${feature.id}/">${feature.properties.title}</a></h4>`);
                }
            }} />}
        </Map>
    </Fragment>;
}
