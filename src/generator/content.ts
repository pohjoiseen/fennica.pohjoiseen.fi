/**
 * Generation of content from Markdown files.
 * 
 * This is where most heavy lifting actually happens.
 */
import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';
import chalk from 'chalk';
import {FeatureCollection} from 'geojson';
import matter from 'gray-matter';
import marked from 'marked';
import cheerio from 'cheerio';
import Typograf from 'typograf';
import {imageSize} from 'image-size';
import {
    Article,
    ArticleDefinition,
    Map,
    MapDefinition,
    POI,
    POIDefinition,
    Post,
    PostDefinition
} from '../contentTypes';
import {getBuildDir, getContentDir} from './paths';
import {LANGUAGES} from '../const';

// Base name -> path map for all Markdown content
interface ContentMap {
    [lang: string]: {
        maps: {[name: string]: string};
        pois: {[name: string]: string};
        articles: {[name: string]: string};
        posts: {[name: string]: string};
    }
}

export const contentMap: ContentMap = {};

// POIs indexed by path (parent-poi-1/parent-poi-2/this-poi -> POI)
const poiPathIndex: {[lang: string]: {[path: string]: POI}} = {};

// Blog posts ordered by date
export const postsOrdered: {[lang: string]: string[]} = {};

// "Database" of loaded content
export const poiContent: {[lang: string]: {[name: string]: POI}} = {};
export const mapContent: {[lang: string]: {[name: string]: Map}} = {};
export const articleContent: {[lang: string]: {[name: string]: Article}} = {};
export const postContent: {[lang: string]: {[name: string]: Post}} = {};

/**
 * Scans content dir for Markdown files and builds up a ContentMap.
 */
const scanContent = () => {
    const root = getContentDir();
    const counts = {maps: 0, pois: 0, articles: 0, posts: 0};
    const mdFiles = fg.sync('**/*.md', {absolute: true, cwd: root});
    for (let mdPath of mdFiles) {
        const mdFilename = path.basename(mdPath);
        const match = mdPath.match(/^(.+)\.([^.]+)\.([^.]+)\.md$/);
        if (!match) {
            throw new Error(`Content file ${mdPath} filename could not be parsed (missing language and/or type?`);
        }
        const name = path.basename(match[1]), type = match[3], lang = match[2];
        if (LANGUAGES.indexOf(lang) === -1) {
            throw new Error(`Language ${lang} unknown for content file ${mdPath}`);
        }
        if (!contentMap[lang]) {
            contentMap[lang] = {maps: {}, pois: {}, articles: {}, posts: {}};
        }
        switch (type) {
            case 'map': {
                if (contentMap[lang].maps[name]) {
                    throw new Error(`Duplicate map name for ${contentMap[lang].maps[name]} and ${mdPath}`);
                }
                contentMap[lang].maps[name] = mdPath;
                counts.maps++;
                break;
            }
            case 'poi': {
                if (contentMap[lang].pois[name]) {
                    throw new Error(`Duplicate POI name for ${contentMap[lang].pois[name]} and ${mdPath}`);
                }
                contentMap[lang].pois[name] = mdPath;
                counts.pois++;
                break;
            }
            case 'article': {
                if (contentMap[lang].articles[name]) {
                    throw new Error(`Duplicate article name for ${contentMap[lang].articles[name]} and ${mdPath}`);
                }
                contentMap[lang].articles[name] = mdPath;
                counts.articles++;
                break;
            }
            case 'post': {
                if (contentMap[lang].posts[name]) {
                    throw new Error(`Duplicate post name for ${contentMap[lang].posts[name]} and ${mdPath}`);
                }
                const matchPost = name.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
                if (!matchPost) {
                    throw new Error(`Malformed post name for ${mdPath}, should be YYYY-MM-DD-name.XX.post.md`);
                }
                contentMap[lang].posts[name] = mdPath;
                counts.posts++;
                break;
            }

            default: {
                throw new Error(`Type ${type} unknown for content file ${mdPath}`);
            }
        }
    }
    console.log(`Found map(s): ${chalk.greenBright(counts.maps)}, POI(s): ${chalk.greenBright(counts.pois)}, ` +
        `article(s): ${chalk.greenBright(counts.articles)}, post(s): ${chalk.greenBright(counts.posts)}`);
}

/**
 * Loads and parses (any) file with front matter.
 *
 * @param {string} path
 */
const loadContent = (path: string) => {
    const fileContent = fs.readFileSync(path, {encoding: 'utf8'});
    const parsed = matter(fileContent);
    return {data: parsed.data, content: parsed.content};
}

/**
 * Fix links in HTML by rebasing them from a different path.
 *
 * @param {string} html
 */
const fixupLinkPath = (html: string) => {
    // use Cheerio library to muck with HTML
    const $ = cheerio.load(html, {decodeEntities: false});

    // quick and dirty check whether this is something we actually need to touch
    const needToConvert = (str: string) => str.indexOf('://') === -1 && str.endsWith('.md');

    // how to actually convert
    const convert = (url: string) => {
        // ignore all relative part since our URLs are non-hierarchical
        url = url.replace(/^(.*\/)?([^\/]+)\.md/, '$2');
        // blog post
        const matchPost = url.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.([^.]+)\.post$/);
        if (matchPost) {
            if (!contentMap[matchPost[5]].posts[`${matchPost[1]}-${matchPost[2]}-${matchPost[3]}-${matchPost[4]}`]) {
                throw new Error(`Broken link to post ${url}`);
            }
            return `/${matchPost[5]}/${matchPost[1]}/${matchPost[2]}/${matchPost[3]}/${matchPost[4]}/`;
        }
        // other types
        const mapping: {[urlPart: string]: string} = {
            'map': 'map',
            'poi': 'place',
            'article': 'article',
        };
        const match = url.match(/^(.+)\.([^.]+)\.([^.]+)$/);
        if (!match || !mapping[match[3]]) {
            throw new Error(`Content file ${url} has unknown type or malformed filename`);
        }
        return `/${match[2]}/${mapping[match[3]]}/${match[1]}/`;
    }

    // href attributes
    $('[href]').each((k, el) => {
        let link = $(el).attr('href');
        if (needToConvert(link!)) {
            $(el).attr('href',  convert(link!));
        }
    });

    return $.html();
}

export const getImageSources = (src: string, basepath: string) => {
    let srcOrig = path.resolve(basepath, src);
    if (!fs.existsSync(srcOrig)) {
        throw new Error(`Could not resolve image ${src}, not found file ${srcOrig}`);
    }
    srcOrig = srcOrig.replace(getContentDir(), getBuildDir());
    let src1x = srcOrig.replace(/(\.[^.]+)$/, '.1x$1');
    const size1x = imageSize(src1x);
    srcOrig = srcOrig.replace(getBuildDir(), '');
    src1x = src1x.replace(getBuildDir(), '');
    const src2x = srcOrig.replace(/(\.[^.]+)$/, '.2x$1');
    const srcThumb = srcOrig.replace(/(\.[^.]+)$/, '.t$1');
    return {srcOrig, src1x, src2x, srcThumb, width1x: size1x.width, height1x: size1x.height};
}

const fixupImages = (html: string, basepath: string) => {
    // use Cheerio library to muck with HTML
    const $ = cheerio.load(html, {decodeEntities: false});

    $('img').each((k, el) => {
        let $el = $(el);
        if ($el.attr('raw')) {
            return;
        }

        const sources = getImageSources($el.attr('src')!, basepath);
        $el.attr('width', sources.width1x!.toString());
        $el.attr('height', sources.height1x!.toString());
        $el.attr('src', sources.src1x);
        $el.attr('srcset', `${sources.src1x}, ${sources.src2x} 2x`);
        if ($el.attr('nofigure')) {
            $el = $el.wrap(`<a href="${sources.srcOrig}"></a>`);
        } else {
            const caption = $el.attr('alt');
            const captionHtml = caption ? `<figcaption>${caption}</figcaption>` : '';
            $el = $(el).wrap(`<figure><a href="${sources.srcOrig}"></a>${captionHtml}</figure>`);
        }
    });
    
    return $.html();
}

/**
 * Convert markdown into HTML and apply auto-typography, link and image postprocessing.
 *
 * @param {string} text
 * @param {string} lang
 * @param {string} basepath
 * @param {boolean} multiParagraph
 */
const formatText = (text: string, lang: string, basepath: string, multiParagraph?: boolean): string => {
    if (!text) return '';

    // Process Markdown.  The result will always be at least wrapped into a paragraph, delete wrapping <p>...</p>
    // tags if we don't want them
    text = marked(text.toString());
    if (!multiParagraph) {
        text = text.replace(/^<p>/, '').replace(/<\/p>\s*$/, '');
    }

    // Convert links to other content
    text = fixupLinkPath(text);

    // Convert images references
    text = fixupImages(text, basepath);

    // Typographics (quotes, non-breakable spaces, etc.)  Note: hardcoded in expectation of English and Russian content
    const tp = new Typograf({locale: ['ru', 'en-US']});
    tp.disableRule('common/html/*');
    tp.disableRule('common/symbols/cf');
    if (lang !== 'ru') {
        tp.disableRule('common/punctuation/quote');
    }
    text = tp.execute(text);
    text = text.replace(/^<html><head><\/head><body>/, '').replace(/<\/body><\/html>\s*$/, '');

    return text;
}

/**
 * Convert item list to a format usable by react-image-gallery.
 *
 * @param items
 * @param basepath
 */
export const prepareGalleryItems = (items: (string | {url: string, title?: string})[], basepath: string) =>
    items.map(item => {
        if (typeof item === 'string') {
            item = {url: item};
        }

        const sources = getImageSources(item.url, basepath);
        return {
            original: sources.src1x,
            fullscreen: sources.srcOrig,
            srcSet: `${sources.src1x}, ${sources.src2x} 2x`,
            thumbnail: sources.srcThumb,
            description: item.title,
        };
    });

/**
 * Apply formatting to texts in POI content.
 *
 * @param {POI} poi
 * @param {string} lang
 */
const formatPOI = (poi: POI, lang: string) => {
    const basepath = path.dirname(contentMap[lang].pois[poi.name]);

    poi.content = formatText(poi.content, lang, basepath, true);
    poi.data.subtitle = poi.data.subtitle ? formatText(poi.data.subtitle, lang, basepath) : undefined;
    poi.data.description = formatText(poi.data.description, lang, basepath);
    poi.data.address = poi.data.address ? formatText(poi.data.address, lang, basepath) : undefined;
    poi.data.seasonDescription = poi.data.seasonDescription ? formatText(poi.data.seasonDescription, lang, basepath) : undefined;
    poi.data.accessDescription = poi.data.accessDescription ? formatText(poi.data.accessDescription, lang, basepath) : undefined;
    if (poi.data.more) {
        for (let key of Object.keys(poi.data.more)) {
            poi.data.more[key] = formatText(poi.data.more[key], lang, basepath);
        }
    }
    if (poi.data.externalLinks) {
        const externalLinks: {[title: string]: string} = {};
        for (let key of Object.keys(poi.data.externalLinks)) {
            externalLinks[formatText(key, lang, basepath)] = poi.data.externalLinks[key];
        }
        poi.data.externalLinks = externalLinks;
    }
    if (poi.data.gallery) {
        poi.galleryPrepared = prepareGalleryItems(poi.data.gallery, basepath);
    }
}

/**
 * Loads POI content and processes textual parts.
 *
 * @param {string} name
 * @param {string} lang
 */
const preloadPOI = (name: string, lang: string) => {
    poiContent[lang][name] = {...loadContent(contentMap[lang].pois[name]) as {data: POIDefinition, content: string}, name, geoJSONs: []};
    formatPOI(poiContent[lang][name], lang);
}

/**
 * Preloads POIS, builds an index of "paths" to POIs.  E. g. if there's a POI named "a" with parent "b", whose parent is "c",
 * then "c/b/a" -> "a" entry will be returned as a result.
 * This involves loading and parsing ALL POIs and therefore obviously slow.  Result is cached.
 * This also saves poi data to a JSON file in public folder.
 *
 * @param {string} lang
 */
const preloadPOIs = (lang: string) => {
    poiPathIndex[lang] = {};
    poiContent[lang] = {};
    const poiList = contentMap[lang].pois;
    for (let name of Object.keys(poiList)) {
        preloadPOI(name, lang);
    }
    for (let name of Object.keys(poiList)) {
        let path = name, parent = poiContent[lang][name].data.parent;
        while (parent) {
            path = `${parent}/${path}`;
            parent = poiContent[lang][parent].data.parent;
        }
        poiPathIndex[lang][path] = poiContent[lang][name];
    }
}

/**
 * Apply formatting to texts in map content.
 *
 * @param {Map} map
 * @param {string} lang
 */
const formatMap = (map: Map, lang: string) => {
    const basepath = path.dirname(contentMap[lang].maps[map.name]);
    map.content = formatText(map.content, lang, basepath, true);
}
/**
 * Loads map content and processes textual parts.
 *
 * @param {string} name
 * @param {string} lang
 */
const preloadMap = (name: string, lang: string) => {
    mapContent[lang][name] = {...loadContent(contentMap[lang].maps[name]) as {data: MapDefinition, content: string}, name, geoJSONs: []};
    formatMap(mapContent[lang][name], lang);
}

/**
 * Preloads all map content.
 *
 * @param {string} lang
 */
const preloadMaps = (lang: string) => {
    mapContent[lang] = {};
    const mapList = contentMap[lang].maps;
    for (let name of Object.keys(mapList)) {
        preloadMap(name, lang);
    }
}

/**
 * Apply formatting to texts in article content.
 *
 * @param {Article} article
 * @param {string} lang
 */
const formatArticle = (article: Article, lang: string) => {
    const basepath = path.dirname(contentMap[lang].articles[article.name]);
    article.content = formatText(article.content, lang, basepath, true);
}

/**
 * Loads article content and processes textual parts.
 *
 * @param {string} name
 * @param {string} lang
 */
const preloadArticle = (name: string, lang: string) => {
    articleContent[lang][name] = {...loadContent(contentMap[lang].articles[name]) as {data: ArticleDefinition, content: string}, name};
    formatArticle(articleContent[lang][name], lang);
}

/**
 * Preloads all article content.
 *
 * @param {string} lang
 */
const preloadArticles = (lang: string) => {
    articleContent[lang] = {};
    const articleList = contentMap[lang].articles;
    for (let name of Object.keys(articleList)) {
        preloadArticle(name, lang);
    }
}

/**
 * Apply formatting to texts in post content.
 *
 * @param {Post} post
 * @param {string} lang
 */
const formatPost = (post: Post, lang: string) => {
    const basepath = path.dirname(contentMap[lang].posts[post.name]);
    post.content = formatText(post.content, lang, basepath, true);
}

/**
 * Loads post content and processes textual parts.
 *
 * @param {string} name
 * @param {string} lang
 */
const preloadPost = (name: string, lang: string) => {
    postContent[lang][name] = {...loadContent(contentMap[lang].posts[name]) as {data: PostDefinition, content: string}, name};
    formatPost(postContent[lang][name], lang);
}

/**
 * Preloads all post content.
 *
 * @param {string} lang
 */
const preloadPosts = (lang: string) => {
    postContent[lang] = {};
    const postList = contentMap[lang].posts;
    for (let name of Object.keys(postList)) {
        preloadPost(name, lang);
    }
}

/**
 * Builds up ordered posts list and interlinks posts.
 *
 * @param {string} lang
 */
const orderPosts = (lang: string) => {
    const postList = contentMap[lang].posts;
    postsOrdered[lang] = [...Object.keys(postList)];
    postsOrdered[lang].sort().reverse();
    for (let k = 0; k < postsOrdered[lang].length; k++) {
        const postName = postsOrdered[lang][k];
        if (k > 0) {
            postContent[lang][postName].next = postsOrdered[lang][k - 1];
        }
        if (k < postsOrdered[lang].length - 1) {
            postContent[lang][postName].prev = postsOrdered[lang][k + 1];
        }
    }
}

/**
 * Transforms POIs map to GeoJSON layers for 16 zoom levels.
 *
 * @param {object} pois
 */
const poisToGeoJSON = (pois: {[path: string]: POI}): FeatureCollection[] => {
    const result: FeatureCollection[] = [];
    for (let k = 0; k < 16; k++) {
        result.push({type: 'FeatureCollection', features: []});
    }
    for (let poi of Object.values(pois)) {
        result[poi.data.minZoom || Math.max(1, poi.data.zoom - 4)].features.push({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [poi.data.lng, poi.data.lat],
            },
            id: poi.name,
            properties: {
                type: poi.data.type,
                title: poi.data.title,
                customIcon: poi.data.customIcon,
                customIconSize: poi.data.customIconSize
            }
        });
    }
    return result;
}

/**
 * Generates GeoJSON for map POIs.
 *
 * @param {string} mapName
 * @param {string} lang
 */
const generateGeoJSONForMap = (mapName: string, lang: string) => {
    const mapDefinition = mapContent[lang][mapName].data;
    let targetPois: {[path: string]: POI} = {};
    if (mapName === 'index') {
        // index map is special, it always has all POIs
        targetPois = poiPathIndex[lang];
    } else {
        // add all POIs that are explicitly specified as top level for this map.  Also make them display at all zoom levels
        for (let [path, poi] of Object.entries(poiPathIndex[lang])) {
            let topLevelInMap = poi.data.map;
            if (typeof topLevelInMap === 'string') {
                topLevelInMap = [topLevelInMap];
            }
            if (topLevelInMap && topLevelInMap.includes(mapName)) {
                targetPois[path] = {...poi, data: {...poi.data, minZoom: 1}};
            }
        }
        // add all POIs that belong to the map by type
        if (mapDefinition.poiTypes) {
            for (let [path, poi] of Object.entries(poiPathIndex[lang])) {
                if (mapDefinition.poiTypes.includes(poi.data.type)) {
                    targetPois[path] = poi;
                }
            }
        }
    }

    mapContent[lang][mapName].geoJSONs = poisToGeoJSON(targetPois);
}

/**
 * Generates GeoJSON for all maps.
 *
 * @param {string} lang
 */
const generateGeoJSONForMaps = (lang: string) => {
    for (let name of Object.keys(contentMap[lang].maps)) {
        generateGeoJSONForMap(name, lang);
    }
}

/**
 * Generates GeoJSON for POI mini-sub-map.
 *
 * @param {string} poiName
 * @param {string} lang
 */
const generateGeoJSONForPOI = (poiName: string, lang: string) => {
    const poiDefinition = poiContent[lang][poiName].data;
    
    // if this POI has a parent, look not for children but for siblings
    let parentPoiName = poiName;
    if (poiDefinition.parent) {
        parentPoiName = poiDefinition.parent;
    }

    const poiPath = Object.keys(poiPathIndex[lang]).find(poiPath => poiPathIndex[lang][poiPath].name === parentPoiName);
    
    // always add self
    let targetPois: {[path: string]: POI} = {[poiPath!]: poiPathIndex[lang][poiPath!]};

    // add all siblings/children of this POIs
    if (poiPath) {
        for (let childPath of Object.keys(poiPathIndex[lang])) {
            if (childPath.startsWith(poiPath + '/') && !targetPois[childPath]) {
                targetPois[childPath] = poiPathIndex[lang][childPath];
            }
        }
    }

    poiContent[lang][poiName].geoJSONs = poisToGeoJSON(targetPois);
}

/**
 * Generates GeoJSON for all POIs.
 *
 * @param {string} lang
 */
const generateGeoJSONForPOIs = (lang: string) => {
    for (let name of Object.keys(contentMap[lang].pois)) {
        generateGeoJSONForPOI(name, lang);
    }
}

/**
 * Writes out to output dir JSON with all POI data.  (Map pages load this dynamically.)
 *
 * @param {string} poiName
 * @param {string} lang
 */
const outputPOI = (poiName: string, lang: string) => {
    fs.mkdirSync(`${getBuildDir()}/${lang}/place`, {recursive: true});
    fs.writeFileSync(`${getBuildDir()}/${lang}/place/${poiName}.json`, JSON.stringify(poiContent[lang][poiName]), {encoding: 'utf8'});
}

/**
 * Writes out to output dir JSONs for all POIs.
 *
 * @param {string} lang
 */
const outputPOIs = (lang: string) => {
    for (let name of Object.keys(contentMap[lang].pois)) {
        outputPOI(name, lang);
    }
}

/**
 * Removes all content marked as draft.
 * 
 * @param {string} lang 
 */
const trimDrafts = (lang: string) => {
    if (mapContent[lang]) {
        for (let map of Object.values(mapContent[lang])) {
            if (map.data.draft) {
                delete mapContent[lang][map.name];
                delete contentMap[lang].maps[map.name];
            }
        }
    }
    if (poiContent[lang]) {
        for (let poi of Object.values(poiContent[lang])) {
            if (poi.data.draft) {
                delete poiContent[lang][poi.name];
                delete contentMap[lang].pois[poi.name];
            }
        }
    }
    if (postContent[lang]) {
        for (let post of Object.values(postContent[lang])) {
            if (post.data.draft) {
                delete postContent[lang][post.name];
                delete contentMap[lang].posts[post.name];
            }
        }
    }
    if (articleContent[lang]) {
        for (let article of Object.values(articleContent[lang])) {
            if (article.data.draft) {
                delete articleContent[lang][article.name];
                delete contentMap[lang].articles[article.name];
            }
        }
    }
}

/**
 * Scans and loads all content, writes out POI JSONs.
 */
export const initContent = (shouldTrimDrafts: boolean) => {
    // Scan for stuff
    console.log(`Initializing step: ${chalk.greenBright('scanning for content')}`);
    scanContent();
    for (let lang of LANGUAGES) {
        if (contentMap[lang]) {
            // Load stuff
            console.log(`Initializing step: ${chalk.greenBright('loading articles for language ' + lang)}`);
            preloadArticles(lang);
            console.log(`Initializing step: ${chalk.greenBright('loading posts for language ' + lang)}`);
            preloadPosts(lang);
            console.log(`Initializing step: ${chalk.greenBright('loading POIs for language ' + lang)}`);
            preloadPOIs(lang);
            console.log(`Initializing step: ${chalk.greenBright('loading maps for language ' + lang)}`);
            preloadMaps(lang);
            // Remove unneccessary stuff
            if (shouldTrimDrafts) {
                console.log(`Initializing step: ${chalk.greenBright('removing drafts for language ' + lang)}`);
                trimDrafts(lang);
            }
            // Build up various stuff indices
            console.log(`Initializing step: ${chalk.greenBright('building map data for POIs for language ' + lang)}`);
            generateGeoJSONForPOIs(lang);
            console.log(`Initializing step: ${chalk.greenBright('building map data for maps for language ' + lang)}`);
            generateGeoJSONForMaps(lang);
            console.log(`Initializing step: ${chalk.greenBright('writing out JSON data for POIs for language ' + lang)}`);
            outputPOIs(lang);
            orderPosts(lang);
        }
    }
}

/**
 * Handles add/change of content file.
 *
 * @param {string} file
 */
export const handleModifyContent = (file: string) => {
    if (!file.endsWith('.md')) {
        return false;
    }

    file = path.resolve(getContentDir(), file);
    const match = file.match(/^(.*)\.([^.]+)\.([^.]+)\.md$/);
    if (!match) {
        return false;
    }
    const name = path.basename(match[1]), lang = match[2], type = match[3];
    switch (type) {

        case 'map':
            console.log(`Map ${chalk.blueBright('change')}: ${chalk.greenBright(file)} - reloading`);
            try {
                contentMap[lang].maps[name] = file;
                preloadMap(name, file)
                generateGeoJSONForMap(name, file);
            } catch (e) {
                console.log(chalk.yellowBright('Failed to reload, error was:'))
                console.log(e);
            }
            return true;

        case 'poi':
            console.log(`POI ${chalk.blueBright('change')}: ${chalk.greenBright(file)} - reloading`);
            try {
                contentMap[lang].pois[name] = file;

                // This is the tricky case but we really want to try to handle this one
                // At least one failure mode is: when parent of an existing POI is changed, and it has children POIs,
                // their paths will get broken.  Well, we really want to handle common cases first and foremost

                // - update poiPathIndex cache
                // delete possible old entries for the POI
                const oldPathMatch = '/' + name, oldPath = Object.keys(poiPathIndex[lang]).find(path => path.endsWith(oldPathMatch));
                if (oldPath) {
                    delete poiPathIndex[lang][oldPath];
                }
                // and [re-]add
                preloadPOI(name, lang);
                let path = name, parent = poiContent[lang][name].data.parent;
                while (parent) {
                    path = `${parent}/${path}`;
                    parent = poiContent[lang][parent].data.parent;
                }
                poiPathIndex[lang][path] = poiContent[lang][name];

                // - generate/output self
                generateGeoJSONForPOI(name, lang);
                outputPOI(name, lang);

                // - generate/output all POIs in parent chain
                let k = 1;
                parent = poiContent[lang][name].data.parent;
                while (parent) {
                    generateGeoJSONForPOI(parent, lang);
                    outputPOI(parent, lang);
                    parent = poiContent[lang][parent].data.parent;
                    k++;
                }

                // - regenerate all maps geo-content (this can be optimized)
                generateGeoJSONForMaps(lang);

                console.log(`Note: regenerated ${chalk.greenBright(Object.keys(contentMap[lang].maps).length)} map(s) and ${chalk.greenBright(k)} POI(s)`);
            } catch (e) {
                console.log(chalk.yellowBright('Failed to reload, error was:'))
                console.log(e);
            }
            return true;

        case 'article':
            console.log(`Article ${chalk.blueBright('change')}: ${chalk.greenBright(file)} - reloading`);
            try {
                contentMap[lang].articles[name] = file;
                preloadArticle(name, lang);
            } catch (e) {
                console.log(chalk.yellowBright('Failed to reload, error was:'))
                console.log(e);
            }
            return true;

        case 'post':
            console.log(`Post ${chalk.blueBright('change')}: ${chalk.greenBright(file)} - reloading`);
            try {
                contentMap[lang].posts[name] = file;
                preloadPost(name, lang);
                orderPosts(lang);
            } catch (e) {
                console.log(chalk.yellowBright('Failed to reload, error was:'))
                console.log(e);
            }
            return true;

    }

    return false;
}

/**
 * Handles remove of content file.  This (like all removes) is a rare operation, at the moment we don't do anything
 * about it and just let it get stale.
 *
 * @param {string} file
 */
export const handleRemoveContent = (file: string) => {
    if (!file.endsWith('.md')) {
        return false;
    }

    file = path.resolve(getContentDir(), file);
    const match = file.match(/^(.*)\.([^.]+)\.([^.]+)\.md$/);
    if (!match) {
        return false;
    }
    const type = match[3];
    switch (type) {
        case 'map':
        case 'poi':
        case 'article':
        case 'post':
            // TODO: do something?
            console.log(`Content ${chalk.blueBright('remove')}: ${chalk.greenBright(file)} - ignoring`);
            console.log(chalk.yellowBright('CONTENT POSSIBLY INVALIDATED: Existing content deleted.  ' +
                'Not attempting to update prebuilt data, they are stale now.  Consider full regeneration (devserver restart)'));
            return true;
    }
    return false;
}
