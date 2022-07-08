/**
 * Dev-server operation mode.  This necessarily largely duplicates generator.tsx.
 */
import * as React from 'react';
import chalk from 'chalk';
import chokidar from 'chokidar';
import express, {NextFunction, Request, Response} from 'express';
import morgan from 'morgan';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackConfig from '../client/webpack.config.dev';
import {getBuildDir, getContentDir} from './paths';
import {handleModifyStaticDir, handleRemoveStaticDir} from './staticDir';
import {handleModifyImage, handleRemoveImage} from './images';
import {
    articleContent,
    handleModifyContent,
    handleRemoveContent,
    postContent,
    postsOrdered
} from './content';
import {DEVSERVER_PORT, LANGUAGES, POSTS_PER_PAGE} from '../const';
import {renderFeed, renderPage} from './util';
import {ArticlePage} from '../templates/ArticlePage';
import {PostPage} from '../templates/PostPage';
import {BlogPage} from '../templates/BlogPage';

/**
 * Setup watcher on content dir.  This must be done before actually building anything to catch possible changes DURING the build.
 */
export const setupWatcher = () => {
    const watcher = chokidar.watch(getContentDir(), {
        awaitWriteFinish: true,
        ignoreInitial: true,
    })

    const handleModify = async (path: string, isAdd: boolean) => {
        handleModifyStaticDir(path) || await handleModifyImage(path, isAdd) || handleModifyContent(path);
    }
    const handleRemove = (path: string) => {
        handleRemoveStaticDir(path) || handleRemoveImage(path) || handleRemoveContent(path);
    }

    watcher
        .on('add', path => handleModify(path, true))
        .on('change', path => handleModify(path, false))
        .on('unlink', handleRemove);
        
    return watcher;
}

/**
 * Run dev-server with webpack and everything.
 */
export const runServer = () => {
    console.log(chalk.blueBright('Now watching content dir for changes'))
    // Watcher is set up above -- now will just do its job

    // Server
    const app = express();
    app.use(morgan('dev'));

    // Webpack
    const compiler = webpack(webpackConfig);
    app.use(webpackDevMiddleware(compiler, {publicPath: '/static', index: false, serverSideRender: true}));

    // Article pages
    app.get('/:lang/article/:name?/', (req, res) => {
        const name = req.params.name || 'index';
        if (articleContent[req.params.lang] && articleContent[req.params.lang][name]) {
            const article = articleContent[req.params.lang][name];
            const prev = article.data.prev ? articleContent[req.params.lang][article.data.prev] : undefined;
            const next = article.data.next ? articleContent[req.params.lang][article.data.next] : undefined;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(renderPage(<ArticlePage lang={req.params.lang} article={article} prev={prev} next={next}
                                            bundlePath="/static/bundle.js" />));
        }
    });

    // Post pages
    app.get('/:lang/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:name/', (req, res) => {
        const name = `${req.params.year}-${req.params.month}-${req.params.day}-${req.params.name}`;
        if (postContent[req.params.lang] && postContent[req.params.lang][name]) {
            const post = postContent[req.params.lang][name];
            const prev = post.prev ? postContent[req.params.lang][post.prev] : undefined;
            const next = post.next ? postContent[req.params.lang][post.next] : undefined;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(renderPage(<PostPage lang={req.params.lang} post={post} prev={prev} next={next}
                                        bundlePath="/static/bundle.js" />));
        }
    });

    // Blog pages
    const blogPage = (category: string, req: Request, res: Response, next: NextFunction) => {
        const page = Number(req.params.page) || 1, lang = req.params.lang;
        // this route will also catch something like /favicon.ico, make sure it's really a valid language
        if (!LANGUAGES.includes(lang)) {
            next();
            return;
        }

        const articleName = category === '' ? 'index' : 'index-' + category;
        const article = articleContent[req.params.lang][articleName];
        const totalPages = Math.ceil(postsOrdered[category][lang].length / POSTS_PER_PAGE);
        if (page >= 1 && page <= totalPages) {
            const posts = postsOrdered[category][lang]
                .slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)
                .map(postName => postContent[lang][postName]);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(renderPage(<BlogPage lang={req.params.lang} category={category}
                                          article={article} posts={posts} page={page} totalPages={totalPages}
                                          bundlePath="/static/bundle.js" />));
        }
    };

    app.get('/:lang/:category/:page(\\d+)?/', (req, res, next) => blogPage(req.params.category, req, res, next));
    app.get('/:lang/:page(\\d+)?/', (req, res, next) => blogPage('', req, res, next));

    // Blog RSS
    app.get('/:lang/rss.xml', (req, res) => {
        const lang = req.params.lang;
        const posts = postsOrdered[''][lang]
            .slice(0, POSTS_PER_PAGE)
            .map(postName => postContent[lang][postName]);
        res.setHeader('Content-Type', 'text/xml; charset=utf-8');
        res.send(renderFeed(lang, posts));
    });

    // Static files
    app.use(express.static(getBuildDir()));

    app.listen(DEVSERVER_PORT);
    console.log(chalk.magentaBright(`Server running on port ${DEVSERVER_PORT}`));
}