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
    Post,
    PostDefinition
} from '../contentTypes';
import {getBuildDir, getContentDir, pathResolve} from './paths';
import {LANGUAGES} from '../const';
import {getImageLink} from './util';

// Base name -> path map for all Markdown content
interface ContentMap {
    [lang: string]: {
        articles: {[name: string]: string};
        posts: {[name: string]: string};
    }
}

export const contentMap: ContentMap = {};

// Blog posts ordered by date and category
export const postsOrdered: {[category: string]: {[lang: string]: string[]}} = {};

// Map data built from posts
export const mapData: {[lang: string]: {[name: string]: FeatureCollection[]}} = {};

// "Database" of loaded content
export const articleContent: {[lang: string]: {[name: string]: Article}} = {};
export const postContent: {[lang: string]: {[name: string]: Post}} = {};

/**
 * Scans content dir for Markdown files and builds up a ContentMap.
 */
const scanContent = () => {
    const root = getContentDir();
    const counts = {articles: 0, posts: 0};
    const mdFiles = fg.sync('**/*.md', {absolute: true, cwd: root});
    for (let mdPath of mdFiles) {
        const match = mdPath.match(/^(.+)\.([^.]+)\.([^.]+)\.md$/);
        if (!match) {
            throw new Error(`Content file ${mdPath} filename could not be parsed (missing language and/or type?`);
        }
        const name = path.basename(match[1]), type = match[3], lang = match[2];
        if (LANGUAGES.indexOf(lang) === -1) {
            throw new Error(`Language ${lang} unknown for content file ${mdPath}`);
        }
        if (!contentMap[lang]) {
            contentMap[lang] = {articles: {}, posts: {}};
        }
        switch (type) {
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
    console.log(`Found post(s): ${chalk.greenBright(counts.posts)}, ` +
        `article(s): ${counts.articles}.`);
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
    const needToConvert = (str: string) => str.indexOf('://') === -1 && (str.endsWith('.md') || str.indexOf('.md#') !== -1);

    // how to actually convert
    const convert = (url: string) => {
        const split = url.split('#');
        let hash = '';
        if (split.length > 1) {
            url = split[0];
            hash = split[1];
        }
        
        // ignore all relative part since our URLs are non-hierarchical
        url = url.replace(/^(.*\/)?([^\/]+)\.md/, '$2');
        // blog post
        const matchPost = url.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.([^.]+)\.post$/);
        if (matchPost) {
            if (!contentMap[matchPost[5]].posts[`${matchPost[1]}-${matchPost[2]}-${matchPost[3]}-${matchPost[4]}`]) {
                throw new Error(`Broken link to post ${url}`);
            }
            return `/${matchPost[5]}/${matchPost[1]}/${matchPost[2]}/${matchPost[3]}/${matchPost[4]}/${hash ? '#' + hash : ''}`;
        }
        // articles
        const match = url.match(/^(.+)\.([^.]+)\.article$/);
        if (!match) {
            throw new Error(`Cannot link to content file ${url}`);
        }
        // special links for index pages
        if (match[1] === 'index') {
            return `/${match[2]}/${hash ? '#' + hash : ''}`;
        } else if (match[1].startsWith('index-')) {
            return `/${match[2]}/${match[1].replace('index-', '')}/${hash ? '#' + hash : ''}`;
        }
        return `/${match[2]}/article/${match[1]}/${hash ? '#' + hash : ''}`;
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
    let srcOrig
    if (src[0] === '/') {
        srcOrig = getContentDir() + src
    } else {
        srcOrig = pathResolve(basepath, src);
    }
    if (!fs.existsSync(srcOrig)) {
        throw new Error(`Could not resolve image ${src}, not found file ${srcOrig}`);
    }
    srcOrig = srcOrig.replace(getContentDir(), '');
    const src1x = getImageLink(srcOrig, '1x');
    const src2x = getImageLink(srcOrig, '2x');
    const srcThumb = getImageLink(srcOrig, 't');
    const size1x = imageSize(getBuildDir() + src1x);
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
            $el.wrap(`<figure><a href="${sources.srcOrig}"></a>${captionHtml}</figure>`);
            // unwrap resulting <figure> from <p> tag, if there is one.
            // <figure> can't be contained in <p>, and $.html() would spit out
            // <p></p><figure>...</figure><p></p> markup, which is harmless but incorrect and annoying
            const $p = $el.parent().parent().parent();
            if ($p[0].type === 'tag' && $p[0].tagName === 'p' && $p[0].children.length === 1) {
                $($p[0].children[0]).insertAfter($p);
                $p.remove();
            }
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
export const formatText = (text: string, lang: string, basepath: string, multiParagraph?: boolean): string => {
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
    if (lang === 'fi') {
        // for semicolons pretty much
        tp.disableRule('common/space/afterPunctuation');
        tp.disableRule('common/space/afterColon');
    }
    text = tp.execute(text);
    text = text.replace(/^<html><head><\/head><body>/, '').replace(/<\/body><\/html>\s*$/, '');

    return text;
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
    if (post.data.titleImage && post.data.titleImageInText) {
        post.content = `![${post.data.titleImageCaption ? post.data.titleImageCaption : ''}](${post.data.titleImage})\n\n${post.content}`
    }
    post.content = formatText(post.content, lang, basepath, true);
    post.data.description = post.data.description ? formatText(post.data.description, lang, basepath) : undefined;
    post.data.titleImageCaption = post.data.titleImageCaption ? formatText(post.data.titleImageCaption, lang, basepath) : undefined;
    if (post.data.geo) {
        if (Array.isArray(post.data.geo)) {
            for (const geo of post.data.geo) {
                if (geo.description) {
                    geo.description = formatText(geo.description, lang, basepath);
                }
            }
        } else {
            if (post.data.geo.description) {
                post.data.geo.description = formatText(post.data.geo.description, lang, basepath);
            }
        }
    }
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
    // all posts list
    const postList = contentMap[lang].posts;
    if (!postsOrdered['']) {
        postsOrdered[''] = {};
    }
    postsOrdered[''][lang] = [...Object.keys(postList)];
    postsOrdered[''][lang].sort().reverse();
    
    // interlink posts
    for (let k = 0; k < postsOrdered[''][lang].length; k++) {
        const postName = postsOrdered[''][lang][k];
        if (k > 0) {
            postContent[lang][postName].next = postsOrdered[''][lang][k - 1];
        }
        if (k < postsOrdered[''][lang].length - 1) {
            postContent[lang][postName].prev = postsOrdered[''][lang][k + 1];
        }
    }

    // determine categories
    for (const post of Object.values(postContent[lang])) {
        if (post.data.category && !postsOrdered[post.data.category]) {
            postsOrdered[post.data.category] = {};
        }
    }

    // filter out to categories
    for (const category of Object.keys(postsOrdered)) {
        if (category) {
            postsOrdered[category][lang] = postsOrdered[''][lang].filter(postName => postContent[lang][postName].data.category === category);
        }
    }
}

/**
 * Transforms posts map to GeoJSON layers for 16 zoom levels.
 *
 * @param {object} posts
 */
const postsToGeoJSON = (posts: {[path: string]: Post}): FeatureCollection[] => {
    const result: FeatureCollection[] = [];
    for (let k = 0; k < 16; k++) {
        result.push({type: 'FeatureCollection', features: []});
    }
    for (const post of Object.values(posts)) {
        if (!post.data.geo) {
            continue;
        }
        const geos = Array.isArray(post.data.geo) ? post.data.geo : [post.data.geo];
        for (const geo of geos) {
            result[geo.zoom || 1].features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [geo.lng, geo.lat],
                },
                id: `${post.name}#${geo.lng}-${geo.lat}`,
                properties: {
                    title: geo.title || post.data.title,
                    icon: geo.icon,
                    maps: geo.maps,
                }
            });
        }
    }
    return result;
}

/**
 * Generates GeoJSON for all maps.
 *
 * @param {string} lang
 */
const generateGeoJSONForMaps = (lang: string) => {
    // unfiltered data
    mapData[lang] = {'': postsToGeoJSON(postContent[lang])};
    
    // find out which maps we do have
    const maps: string[] = [];
    for (const featureCollection of mapData[lang]['']) {
        for (const feature of featureCollection.features) {
            if (feature.properties && feature.properties.maps) {
                for (const map of feature.properties.maps) {
                    if (!maps.includes(map)) {
                        maps.push(map);
                    }
                }
            }
        }
    }

    // filter out maps
    for (const map of maps) {
        mapData[lang][map] = [];
        for (const featureCollection of mapData[lang]['']) {
            mapData[lang][map].push({
                ...featureCollection,
                features: featureCollection.features.filter(feature =>
                    feature.properties && feature.properties.maps && feature.properties.maps.includes(map))
            });
        }
    }
}


/**
 * Writes out to output dir JSON with all post (meta)data.  (Map pages load this dynamically.)
 *
 * @param {string} postName
 * @param {string} lang
 */
const outputPostJSON = (postName: string, lang: string) => {
    fs.mkdirSync(`${getBuildDir()}/${lang}/json`, {recursive: true});
    fs.writeFileSync(`${getBuildDir()}/${lang}/json/${postName}.json`, JSON.stringify(postContent[lang][postName].data), {encoding: 'utf8'});
}

/**
 * Writes out to output dir JSONs for all posts.
 *
 * @param {string} lang
 */
const outputPostsJSON = (lang: string) => {
    for (let name of Object.keys(contentMap[lang].posts)) {
        outputPostJSON(name, lang);
    }
}

/**
 * Removes all content marked as draft.
 * 
 * @param {string} lang 
 */
const trimDrafts = (lang: string) => {
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
 * Scans and loads all content, writes out post JSONs.
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
            // Remove unneccessary stuff
            if (shouldTrimDrafts) {
                console.log(`Initializing step: ${chalk.greenBright('removing drafts for language ' + lang)}`);
                trimDrafts(lang);
            }
            // Build up various stuff indices
            console.log(`Initializing step: ${chalk.greenBright('building map data for for language ' + lang)}`);
            generateGeoJSONForMaps(lang);
            console.log(`Initializing step: ${chalk.greenBright('writing out JSON data for maps for language ' + lang)}`);
            outputPostsJSON(lang);
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

    file = pathResolve(getContentDir(), file);
    const match = file.match(/^(.*)\.([^.]+)\.([^.]+)\.md$/);
    if (!match) {
        return false;
    }
    const name = path.basename(match[1]), lang = match[2], type = match[3];
    switch (type) {

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
                const oldGeo = JSON.stringify(postContent[lang][name] && postContent[lang][name].data.geo
                    ? postContent[lang][name].data.geo : undefined); 
                preloadPost(name, lang);
                orderPosts(lang);
                outputPostJSON(name, lang);
                // regenerate maps only if geodata is actually changed
                if (oldGeo !== JSON.stringify(postContent[lang][name].data.geo)) {
                    generateGeoJSONForMaps(lang);
                }
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

    file = pathResolve(getContentDir(), file);
    const match = file.match(/^(.*)\.([^.]+)\.([^.]+)\.md$/);
    if (!match) {
        return false;
    }
    const type = match[3];
    switch (type) {
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
