/**
 * Generator operation mode.  This necessarily largely duplicates server.tsx.
 */
import * as React from 'react';
import chalk from 'chalk';
import webpack from 'webpack';
import webpackConfig from '../client/webpack.config.prod';
import {articleContent, postContent, postsOrdered} from './content';
import {LANGUAGES, POSTS_PER_PAGE} from '../const';
import {getPostLink, outputFeed, outputPage} from './util';
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
        
        const info = stats!.toJson();
        if (stats!.hasErrors()) {
            info.errors!.forEach(err => console.error(chalk.redBright(err.message)));
            console.error('Webpack build error, not continuing');
            process.exit(-1);
        }
        if (stats!.hasWarnings()) {
            info.warnings!.forEach(err => console.warn(chalk.yellowBright(err.message)));
        }
        
        const bundlePath = `/static/bundle.${stats!.hash}.js`, cssPath = `/static/style.${stats!.hash}.css`;
        
        for (let lang of LANGUAGES) {
            // Article pages
            if (articleContent[lang]) {
                console.log(`Generating step: ${chalk.greenBright(`outputting articles for language ${lang}`)}`);
                for (let article of Object.values(articleContent[lang])) {
                    if (article.name === 'index' || article.name.startsWith('index-')) {
                        continue;
                    }
                    const prev = article.data.prev ? articleContent[lang][article.data.prev] : undefined;
                    const next = article.data.next ? articleContent[lang][article.data.next] : undefined;
                    const outpath = `/${lang}/article/${article.name}/`;
                    outputPage(<ArticlePage lang={lang} article={article} prev={prev} next={next}
                        bundlePath={bundlePath} cssPath={cssPath} />, outpath);
                }
            }

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
            console.log(`Generating step: ${chalk.greenBright(`outputting blog pages and RSS feeds for language ${lang}`)}`);
            for (const category of Object.keys(postsOrdered)) {
                if (!postsOrdered[category][lang]) {
                    continue;
                }
                const totalPages = Math.ceil(postsOrdered[category][lang].length / POSTS_PER_PAGE);
                if (totalPages > 0) {
                    const articleName = category === '' ? 'index' : 'index-' + category;
                    const article = articleContent[lang][articleName];

                    for (let page = 1; page <= totalPages; page++) {
                        const posts = postsOrdered[category][lang]
                            .slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)
                            .map(postName => postContent[lang][postName]);
                        const outpath = category
                            ? (page === 1 ? `/${lang}/${category}/` : `/${lang}/${category}/${page}/`)
                            : (page === 1 ? `/${lang}/` : `/${lang}/${page}/`)
                        outputPage(<BlogPage lang={lang} category={category}
                                             posts={posts} article={article} page={page} totalPages={totalPages}
                                             bundlePath={bundlePath} cssPath={cssPath} />, outpath);
                    }
                }
            }
            const posts = postsOrdered[''][lang]
                .slice(0, POSTS_PER_PAGE)
                .map(postName => postContent[lang][postName]);
            outputFeed(lang, posts, `/${lang}/`);
        }
        
        console.log(chalk.magentaBright(`Generation finished successfully`));
    });
}