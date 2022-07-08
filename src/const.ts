/**
 * Assorted constants.
 */
export const CONTENT_DIR = 'content';
export const OUTPUT_DIR = 'build';
export const STATIC_DIR = 'static';

export const MAIN_TITLE = 'Encyclopaedia Fennica';
export const AUTHOR = 'Alexander Ulyanov';
export const COPYRIGHT = '© 2015-2022';
export const FAVICON = '/static/favicon.png';
export const PUBLIC_BASE = 'https://fennica.pohjoiseen.fi';
export const FOOTER_HREF = 'https://www.pohjoiseen.fi/';

export const LANGUAGES = ['en', 'ru', 'fi'];

export const IMAGE_SIZE = 677;
export const THUMB_SIZE = 100;
export const COATOFARMS_DEFAULT_SIZE = 150;

export const ABOUT_ARTICLE = 'about-website';

export const POSTS_PER_PAGE = 25;

export const MAP_SETTINGS = {
    DEFAULT_LAT: 61.504951,
    DEFAULT_LNG: 24.627933,
    DEFAULT_ZOOM: 4,
    MIN_ZOOM: 2,
    MAX_ZOOM: 13,
    ICON_PATH: '/static/map-icons/',
    ICON_WIDTH: 32,
    ICON_HEIGHT: 37,
    ICON_ANCHOR_X: 16,
    ICON_ANCHOR_Y: 34,
    POPUP_ANCHOR_X: 0,
    POPUP_ANCHOR_Y: -19,
    POPUP_WIDTH: 320,
    POPUP_WIDTH_MOBILE: 250,
    MAP_SOURCE: 'https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/maastokartta/default/ETRS-TM35FIN/{z}/{y}/{x}.png?api-key=27e77bfc-266a-4406-afe0-f7e827c11be3',
    //MAP_SOURCE: 'https://tiles.kartat.kapsi.fi/taustakartta_3067/{z}/{x}/{y}.png',
    MAP_ATTRIBUTION: 'Map &copy; <a href="http://www.maanmittauslaitos.fi/avoindata">Maanmittauslaitos</a>, ' +
        'via <a href="https://www.maanmittauslaitos.fi/karttakuvapalvelu/tekninen-kuvaus-wmts">open WMTS API</a>.  Icons: <a href="https://mapicons.mapsmarker.com">Maps Icons Collection</a>' 
}

export const GOOGLE_ANALYTICS_ID = 'UA-72859112-1';

export const RSS_DESCRIPTION: {[lang: string]: string} = {
    en: 'Of Finland and the Nordics.',
    ru: 'О Финляндии и Северных Странах — города и веси, и малоизвестные факты.',
    fi: 'Suomesta ja Pohjoismaista.'
};

export const DEVSERVER_PORT = 8001;
