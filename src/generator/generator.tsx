/**
 * Generator operation mode.  This necessarily largely duplicates server.tsx.
 */
import * as React from 'react';
import chalk from 'chalk';
import webpack from 'webpack';
import webpackConfig from '../client/webpack.config.prod';
import {
    articleContent,
    mapContent,
    poiContent, postContent, postsOrdered
} from './content';
import {LANGUAGES, POSTS_PER_PAGE} from '../const';
import {getPostLink, outputFeed, outputPage} from './util';
import {MapPage} from '../templates/MapPage';
import {PlacePage} from '../templates/PlacePage';
import {ArticlePage} from '../templates/ArticlePage';
import {PostPage} from '../templates/PostPage';
import {BlogPage} from '../templates/BlogPage';

/**
 * Run dev-server with webpack and everything.
 */
export const runGenerator = () => {
    console.log(chalk.blueBright('Now generating HTML pages and JS/CSS bundle'))

    // Begin with webpack
    console.log(`Generating step: ${chalk.greenBright('running webpack')}`);
    webpack(webpackConfig, (err, stats) => {
        if (err) {
            console.error(err.stack || err);
            if ((err as any).details) {
                console.error((err as any).details);
            }
            console.error('Webpack build error, not continuing');
            process.exit(-1);
        }
        
        const info = stats.toJson();
        if (stats.hasErrors()) {
            info.errors.forEach(err => console.error(chalk.redBright(err)));
            console.error('Webpack build error, not continuing');
            process.exit(-1);
        }
        if (stats.hasWarnings()) {
            info.warnings.forEach(err => console.warn(chalk.yellowBright(err)));
        }
        
        const bundlePath = `/static/bundle.${stats.hash}.js`, cssPath = `/static/style.${stats.hash}.css`;
        
        for (let lang of LANGUAGES) {
            // Map pages
            if (mapContent[lang]) {
                console.log(`Generating step: ${chalk.greenBright(`outputting maps for language ${lang}`)}`);
                for (let map of Object.values(mapContent[lang])) {
                    const outpath = `/${lang}/map/${map.name}/`;
                    outputPage(<MapPage lang={lang} map={map} bundlePath={bundlePath} cssPath={cssPath} />, outpath);
                }
            }

            // POI pages
            if (poiContent[lang]) {
                console.log(`Generating step: ${chalk.greenBright(`outputting POIs for language ${lang}`)}`);
                for (let poi of Object.values(poiContent[lang])) {
                    // find out mini-map to display
                    let owningMap = 'index';
                    if (poi.data.topLevelInMap) {
                        if (typeof poi.data.topLevelInMap === 'string') {
                            owningMap = poi.data.topLevelInMap;
                        } else {
                            owningMap = poi.data.topLevelInMap[0];
                        }
                    }
                    const map = mapContent[lang][owningMap];
                    const outpath = `/${lang}/place/${poi.name}/`;
                    outputPage(<PlacePage
                        lang={lang}
                        poi={poi} map={map}
                        bundlePath={bundlePath} cssPath={cssPath}
                    />, outpath);
                }
            }
            
            // Article pages
            if (articleContent[lang]) {
                console.log(`Generating step: ${chalk.greenBright(`outputting articles for language ${lang}`)}`);
                for (let article of Object.values(articleContent[lang])) {
                    const prev = article.data.prev ? articleContent[lang][article.data.prev] : undefined;
                    const next = article.data.next ? articleContent[lang][article.data.next] : undefined;
                    const outpath = article.name === 'index' ? `/${lang}/article/` : `/${lang}/article/${article.name}/`;
                    outputPage(<ArticlePage lang={lang} article={article} prev={prev} next={next}
                        bundlePath={bundlePath} cssPath={cssPath} />, outpath);
                }
            };

            // Post pages
            if (postContent[lang]) {
                console.log(`Generating step: ${chalk.greenBright(`outputting posts for language ${lang}`)}`);
                for (let post of Object.values(postContent[lang])) {
                    const prev = post.prev ? postContent[lang][post.prev] : undefined;
                    const next = post.next ? postContent[lang][post.next] : undefined;
                    const outpath = getPostLink(post.name, lang);
                    outputPage(<PostPage lang={lang} post={post} prev={prev} next={next}
                        bundlePath={bundlePath} cssPath={cssPath} />, outpath);
                }
            }

            // Blog pages and feeds
            const totalPages = Math.ceil(postsOrdered[lang].length / POSTS_PER_PAGE);
            if (totalPages > 0) {
                console.log(`Generating step: ${chalk.greenBright(`outputting blog pages and RSS feeds for language ${lang}`)}`);
                for (let page = 1; page <= totalPages; page++) {
                    const posts = postsOrdered[lang]
                        .slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)
                        .map(postName => postContent[lang][postName]);
                    const outpath = page === 1 ? `/${lang}/` : `/${lang}/${page}/`;
                    outputPage(<BlogPage lang={lang} posts={posts} page={page} totalPages={totalPages}
                        bundlePath={bundlePath} cssPath={cssPath} />, outpath);
                }
                
                const posts = postsOrdered[lang]
                    .slice(0, POSTS_PER_PAGE)
                    .map(postName => postContent[lang][postName]);
                outputFeed(lang, posts, `/${lang}/`);
            }
        }
        
        console.log(chalk.magentaBright(`Generation finished successfully`));
    });
}