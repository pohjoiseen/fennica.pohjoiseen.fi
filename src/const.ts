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

export const LANGUAGES = ['en', 'ru', 'fi'];  // 'fi' is not accessible for UI but we have one post in it

export const IMAGE_SIZE = 677;
export const THUMB_SIZE = 100;
export const COATOFARMS_DEFAULT_SIZE = 150;

export const ABOUT_ARTICLE = 'about-website';

export const POSTS_PER_PAGE = 25;

export const GOOGLE_ANALYTICS_ID = 'UA-72859112-1';

export const RSS_DESCRIPTION: {[lang: string]: string} = {
    en: 'Of Finland and the Nordics.',
    ru: 'О Финляндии и Северных Странах — города и веси, и малоизвестные факты.',
};

export const DEVSERVER_PORT = 8001;
