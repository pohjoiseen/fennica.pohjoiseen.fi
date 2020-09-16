/**
 * <MapPage>: static map page.  In actuality these pages are pretty much 100% dynamic so this one doesn't render much.
 */
import * as React from 'react';
import {Map} from '../contentTypes';
import {Layout} from './Layout';
import {getLanguageVersionURLs} from '../generator/util';
import {ssrComponent} from './ssrComponent';

export interface MapProps {
    lang: string;
    bundlePath: string;
    cssPath?: string;
    map: Map;
}

export const MapPage = (props: MapProps) => {
    const {lang, bundlePath, cssPath, map} = props;

    return <Layout
        title={map.data.title}
        lang={lang}
        bundlePath={bundlePath}
        cssPath={cssPath}
        languageVersions={getLanguageVersionURLs(map.name, 'maps')}
        bodyClass="body-map"
        activeHeaderLink="maps"
        noFooter
    >
        {ssrComponent('mapView', {lang, data: map.data, content: map.content, geoJSONs: map.geoJSONs})}
    </Layout>;
}
