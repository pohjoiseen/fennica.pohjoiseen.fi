/**
 * <MiniMapView>: small map view for POI page.  Renders the POI and its descendants.  Handles clicks
 * by displaying popups.
 */
import React, {useEffect, useState} from 'react';
import {FeatureCollection} from 'geojson';
import {MapDefinition, POIDefinition} from '../contentTypes';

// <MapComponent> uses Leaflet, which cannot be rendered in server context; stub it out.
let MapComponentNoSSR = (props: any) => <div />;
if (typeof window !== 'undefined') {
    MapComponentNoSSR = require('./MapComponent').MapComponent;
}

interface MiniMapViewProps {
    lang: string;
    poiData: POIDefinition;
    mapData: MapDefinition;
    geoJSONs: FeatureCollection[];
}
interface MiniMapViewState {
    isClient: boolean;
    lat: number;
    lng: number;
    zoom: number;
    poi: string | undefined;
    poiTitle: string | undefined;
}

export const MiniMapView = (props: MiniMapViewProps) => {
    const {lang, poiData, mapData, geoJSONs} = props;
    const [state, setState] = useState<MiniMapViewState>({
        isClient: false,
        lat: poiData.lat, lng: poiData.lng,
        zoom: poiData.minZoom ? poiData.minZoom + 2 : mapData.defaultZoom,
        poi: undefined, poiTitle: undefined
    });
    const {lat, lng, zoom, poi, poiTitle} = state;
    // toggle rerender when mounted on client
    useEffect(() => setState(state => ({...state, isClient: true})), []);

    return (
        <div className="map-mini">
            <MapComponentNoSSR
                lang={lang}
                fullscreen={false}
                centerLat={state.lat}
                centerLng={state.lng}
                zoom={state.zoom}
                minZoom={mapData.minZoom}
                maxZoom={mapData.maxZoom}
                mapSource={mapData.mapSource}
                mapSubdomains={mapData.mapSubdomains}
                mapAttribution={mapData.mapAttribution}
                pois={geoJSONs}
                popups
                onMove={(lat: number, lng: number, zoom: number) => {
                    setState(state => ({...state, lat, lng, zoom}));
                }}
                onPoiSelect={(name: string, title: string) => {
                    setState(state => ({...state, poi: name, poiTitle: title}));
                }}
                onPoiDeselect={() => {
                    setState(state => ({...state, poi: undefined, poiTitle: undefined}));
                }}
            />
        </div>
    );
}
