/**
 * <MapView>: the content of map page.  Maps render some subset kind of POIs.  They display some default information
 * on the right side, and POI's information preview by clicking on a POI.
 */
import React, {useEffect, useRef, useState} from 'react';
import {parse, stringify} from 'qs';
import {FeatureCollection} from 'geojson';
import {MapSidePane} from './MapSidePane';
import {MapDefinition} from '../contentTypes';

// <MapComponent> uses Leaflet, which cannot be rendered in server context; stub it out.
let MapComponentNoSSR = (props: any) => <div />;
if (typeof window !== 'undefined') {
    MapComponentNoSSR = require('./MapComponent').MapComponent;
}

interface MapViewProps {
    lang: string;
    data: MapDefinition;
    content: string;
    geoJSONs: FeatureCollection[];
}
interface MapViewState {
    lat: number;
    lng: number;
    zoom: number;
    poi: string | undefined;
    poiTitle: string | undefined;
}

export const MapView = (props: MapViewProps) => {
    const {lang, data, content, geoJSONs} = props;
    const [state, setState] = useState<MapViewState>({lat: 0, lng: 0, zoom: 0, poi: undefined, poiTitle: undefined});
    const {lat, lng, zoom, poi, poiTitle} = state;

    // The source of truth for the map position (center lat/lng/zoom) on page load is hash part of the path
    // Parse it (only on client-side -- useEffect() runs only on client) and use default values if it is missing or malformed
    useEffect(() => {
        if (!lat && !lng && !zoom) {
            const hashStr = window.location.hash.replace(/^#/, '');
            const hash = parse(hashStr) as any;
            let newState;
            if (hash.lat && hash.lng && hash.zoom) {
                newState = {
                    ...state,
                    lat: parseFloat(hash.lat), lng: parseFloat(hash.lng), zoom: parseInt(hash.zoom),
                    poi: hash.poi, poiTitle: hash.poiTitle
                }
            } else {
                newState = {
                    ...state,
                    lat: data.defaultLat,
                    lng: data.defaultLng,
                    zoom: data.defaultZoom,
                    poi: undefined,
                    poiTitle: undefined
                }
            }
            setState(newState);
        }
        window.location.hash = '#' + stringify({lat: lat.toFixed(6), lng: lng.toFixed(6), zoom, poi, poiTitle});
    }, [state.lat, state.lng, state.zoom, state.poi, state.poiTitle]);

    return (
        <div className="map-fullsize">
            {/* Map is rendered only if its center is initialized either from hash or from defaults,
                this also nicely prevents the component being rendered on server at all, which normally would
                need some special handling (since on server-side MapComponentNoSSR is a stub) */}
            {(lat || lng || zoom) ?
            <MapComponentNoSSR
                lang={lang}
                fullscreen={true}
                centerLat={lat}
                centerLng={lng}
                zoom={zoom}
                minZoom={data.minZoom}
                maxZoom={data.maxZoom}
                mapSource={data.mapSource}
                mapSubdomains={data.mapSubdomains}
                mapAttribution={data.mapAttribution}
                pois={geoJSONs}
                onMove={(lat: number, lng: number, zoom: number) => {
                    // Keep hash in sync with map movements
                    setState(state => ({...state, lat, lng, zoom}));
                }}
                onPoiSelect={(name: string, title: string) => {
                    setState(state => ({...state, poi: name, poiTitle: title}));
                }}
                onPoiDeselect={() => {
                    setState(state => ({...state, poi: undefined, poiTitle: undefined}));
                }}
            /> : null}
            <MapSidePane
                content={content}
                lang={lang}
                poiSelected={poi}
                poiSelectedTitle={poiTitle}
            />
        </div>
    );
}
