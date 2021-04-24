import * as React from 'react';
import {ReactElement} from 'react';
import * as path from 'path';
import * as fs from 'fs';
import {renderToStaticMarkup, renderToString} from 'react-dom/server';
import cheerio from 'cheerio';
import {Feed} from 'feed';
import {AUTHOR, COPYRIGHT, FAVICON, LANGUAGES, MAIN_TITLE, PUBLIC_BASE, RSS_DESCRIPTION} from '../const';
import {contentMap} from './content';
import {COMPONENT_MAP} from '../components/components';
import {Post} from '../contentTypes';
import _ from '../l10n';
import { getBuildDir } from './paths';

/**
 * Finds all language versioins of a content item.
 *
 * @param {string} name
 * @param {string} type
 */
export const getLanguageVersionURLs = (name: string, type: 'maps' | 'pois' | 'articles' | 'posts'): {[lang: string]: string} => {
    const result: {[lang: string]: string} = {};
    const pathMap = {
        maps: 'map',
        pois: 'place',
        articles: 'article'
    }

    for (let lang of LANGUAGES) {
        if (contentMap[lang] && contentMap[lang][type][name]) {
            if (type === 'posts') {
                result[lang] = getPostLink(name, lang);
            } else if (name === 'index') {
                result[lang] = `/${lang}/${pathMap[type]}/`;
            } else {
                result[lang] = `/${lang}/${pathMap[type]}/${name}/`
            }
        }
    }

    return result;
}

export const getPostLink = (name: string, lang: string) => {
    const matchPost = name.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
    if (!matchPost) {
        throw new Error(`Cannot link to post ${name}`);
    }
    return `/${lang}/${matchPost[1]}/${matchPost[2]}/${matchPost[3]}/${matchPost[4]}/`;
}

export const getBlogLink = (page: number, lang: string) => {
    if (page <= 1) {
        return `/${lang}/`;
    }
    return `/${lang}/${page}/`;
}

/**
 * Formats post date for the specified language.
 *
 * @param name
 * @param lang
 */
export const formatPostDate = (name: string, lang: string) => {
    const match = name.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2})-/);
    if (match) {
        const date = new Date(match[1]);
        return date.toLocaleDateString(lang, {year: 'numeric', month: 'long', day: 'numeric'});
    }
    return '';
}

/**
 * Creates a RSS feed with specified posts.
 * 
 * @param lang 
 * @param posts 
 */
export const renderFeed = (lang: string, posts: Post[]) => {
    const feed = new Feed({
        title: MAIN_TITLE,
        description: RSS_DESCRIPTION[lang],
        id: PUBLIC_BASE + '/' + lang + '/',
        link: PUBLIC_BASE + '/' + lang + '/',
        language: lang,
        favicon: FAVICON,
        copyright: `${COPYRIGHT} ${AUTHOR}`,
        generator: 'fennica.pohjoiseen.fi custom static site generator',
        author: {
            name: AUTHOR,
        }
    });

    for (let post of posts) {
        const url = PUBLIC_BASE + getPostLink(post.name, lang);
        const match = post.name.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2})-/);
        const date = new Date(match![1]);

        let content = post.content;
        // if there is a cut mark, cut off there
        const cutIndex = content.indexOf('<!--more-->');
        if (cutIndex !== -1) {
            content = content.substr(0, cutIndex);
        }

        // convert images and links to absolute ones
        const $ = cheerio.load(content, {decodeEntities: false});
        $('[src]').each((k, el) => {
            if (el.type === 'tag') {  // always true, just to make TS happy
                const src = el.attribs.src;
                if (src[0] === '/') {
                    $(el).attr('src', PUBLIC_BASE + src);
                }
                $(el).removeAttr('srcset'); // for simplicity
            }
        });
        $('[href]').each((k, el) => {
            if (el.type === 'tag') {
                const href = el.attribs.href;
                if (href[0] === '/') {
                    $(el).attr('href', PUBLIC_BASE + href);
                }
            }
        });
        content = $.html().replace(/^<html><head><\/head><body>/, '').replace(/<\/body><\/html>/, '');
        if (cutIndex !== -1) {
            content += `<p><a href="${url}">${_('Continue reading', lang)}</a></p>`;
        }
        
        feed.addItem({
            title: post.data.title,
            id: url,
            link: url,
            content,
            date,
            image: post.data.titleImage ? PUBLIC_BASE + post.data.titleImage : undefined,
        });
    }

    const xml = feed.rss2();
    return xml;
}

/**
 * Renders any page to static markup with possible client-hydratable components, denoted as
 * <div class="__ssr" data-component-type="..." data-component-props="{foo: bar...}" />.
 *
 * @param page
 */
export const renderPage = (page: ReactElement) => {
    // Render fully-static page
    let html = renderToStaticMarkup(page);

    // Render hydratable SSR components
    const $ = cheerio.load(html, {decodeEntities: false});
    $('.__ssr').each((k, el) => {
        if (el.type !== 'tag') {  // never true, just to make TS happy
            return;
        }
        
        const type = el.attribs['data-component-type'], props = el.attribs['data-component-props'];

        const Component = COMPONENT_MAP[type];
        if (!Component) {
            throw new Error(`Unknown/missing <component> type: ${type}`);
        }

        // render it
        let renderedComponent = renderToString(<Component {...JSON.parse(props)} />);

        // Props are base64-encoded JSON, it's an easiest way to make this play nice with
        // decodeEntities=false in cheerio (and with all the &quot; involved probably this doesn't even waste much space)
        $(el).attr('data-component-props', Buffer.from(props).toString('base64'));
        $(el).append(renderedComponent);
    })
    html = `<!DOCTYPE html>${$.html()}`;

    return html;
}

/**
 * Same as renderPage but also writes it out to a specified path (e. g. /en/article/name/).
 * 
 * @param page 
 * @param webPath Path without build dir or index.html.
 */
export const outputPage = (page: ReactElement, webPath: string) => {
    const html = renderPage(page);
    const fullPath = getBuildDir() + webPath;
    fs.mkdirSync(fullPath, {recursive: true});
    fs.writeFileSync(path.resolve(fullPath, 'index.html'), html, {encoding: 'utf8'});
}

/**
 * Same as renderFeed but also writes it out to a specified path (e. g. /en/).
 * 
 * @param lang
 * @param posts 
 * @param webPath 
 */
export const outputFeed = (lang: string, posts: Post[], webPath: string) => {
    const feed = renderFeed(lang, posts);
    const fullPath = getBuildDir() + webPath;
    fs.mkdirSync(fullPath, {recursive: true});
    fs.writeFileSync(path.resolve(fullPath, 'rss.xml'), feed, {encoding: 'utf8'});
}