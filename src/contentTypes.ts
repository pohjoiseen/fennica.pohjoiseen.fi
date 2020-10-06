/**
 * Content types which are common both in generator and in client context.
 */
import {GeoJSON} from 'geojson';

/**
 * Front matter for .map.XX.md files.
 */
export interface MapDefinition {
    title: string;
    defaultLat: number;
    defaultLng: number;
    defaultZoom: number;
    minZoom: number;
    maxZoom: number;
    mapSource: string;
    mapSubdomains?: string[];
    mapAttribution: string;
    poiTypes?: string[];
    draft?: boolean;
}

export interface Map {
    name: string;
    data: MapDefinition;
    content: string;
    geoJSONs: GeoJSON[];
}

/**
 * Front matter for .poi.XX.md files.
 */
export interface POIDefinition {
    title: string;
    subtitle?: string;
    description: string;
    parent?: string;
    type: string;
    topLevelInMap?: string | string[];
    lat: number;
    lng: number;
    zoom: number;
    minZoom?: number;
    customIcon?: string;
    customIconSize?: [number, number];
    season: string;
    seasonDescription: string;
    access: string;
    accessDescription: string;
    more?: {[item: string]: string};
    externalLinks?: {[title: string]: string};
    gallery?: (string | {url: string, title?: string})[];
    updated: string;
    draft?: boolean;
}

export interface POI {
    name: string;
    data: POIDefinition;
    content: string;
    geoJSONs: GeoJSON[];
    galleryPrepared?: any[];
}

/**
 * Front matter for .article.XX.md files.
 */
export interface ArticleDefinition {
    title: string;
    prev?: string;
    next?: string;
    updated: string;
    draft?: boolean;
}

export interface Article {
    name: string;
    data: ArticleDefinition;
    content: string;
}

/**
 * Front matter for .post.XX.md files.
 */
export interface PostDefinition {
    title: string;
    titleExtraHtml?: string;
    titleImageOffsetY?: number;
    titleImage?: string;
    titleDate?: string;
    draft?: boolean;
}

export interface Post {
    name: string;
    data: PostDefinition;
    content: string;
    prev?: string;
    next?: string;
}

