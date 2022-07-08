/**
 * <BlogPage>: static blog page.
 */
import * as React from 'react';
import {Fragment} from 'react';
import {range} from 'lodash';
import {Article, Post} from '../contentTypes';
import {Layout} from './Layout';
import {formatPostDate, getBlogLink, getImageLink, getPostLink} from '../generator/util';
import _ from '../l10n';
import {HTML} from '../generator/HTML';
import {LANGUAGES} from '../const';
import {normalizeCoatsOfArms} from './util';

export interface BlogPageProps {
    lang: string;
    category: string;
    bundlePath: string;
    cssPath?: string;
    article?: Article;
    posts: Post[];
    page: number;
    totalPages: number;
}

const Pagination = (props: {lang: string, category: string, thisPage: number, totalPages: number}) => {
    const {lang, category, thisPage, totalPages} = props;
    if (totalPages < 2) {
        return null;
    }

    let pages: number[];
    if (totalPages < 11) {
        pages = range(1, totalPages + 1);
    } else if (thisPage <= 6) {
        pages = [...range(1, thisPage + 3), 0, ...range(totalPages - 2, totalPages + 1)];
    } else if (totalPages - thisPage <= 6) {
        pages = [1, 2, 3, 0, ...range(thisPage - 2, totalPages + 1)];
    } else {
        pages = [1, 2, 3, 0, ...range(thisPage - 2, thisPage + 3), 0, ...range(totalPages - 2, totalPages + 1)];
    }

    return <nav className="navigation pagination" role="navigation">
        <h2 className="screen-reader-text">Pages</h2>
        <div className="nav-links">
            {thisPage !== 1 && <><a className="prev page-numbers" href={getBlogLink(category, thisPage - 1, lang)}><span
                className="screen-reader-text">Previous</span><i className="fas fa-arrow-left" /></a> </>}
            {pages.map(page => {
                if (!page) {
                    return <span key={page} className="page-numbers dots">… </span>;
                }
                if (page === thisPage) {
                    return <span key={page} aria-current="page" className="page-numbers current">{page} </span>;
                }
                return <Fragment key={page}> <a className="page-numbers" href={getBlogLink(category, page, lang)}><span
                    className="meta-nav screen-reader-text">Page </span>{page}</a> </Fragment>;
            })}
            {thisPage !== totalPages && <> <a className="next page-numbers" href={getBlogLink(category, thisPage + 1, lang)}><span
                className="screen-reader-text">Next</span><i className="fas fa-arrow-right" /></a></>}
        </div>
    </nav>;
};

export const BlogPage = (props: BlogPageProps) => {
    const {lang, category, bundlePath, cssPath, posts, article, page, totalPages} = props;
    const languageVersions: {[lang: string]: string} = {};
    for (let language of LANGUAGES) {
        languageVersions[language] = `/${language}/`;
    }

    return <Layout
        title={_('Blog', lang)}
        lang={lang}
        bundlePath={bundlePath}
        cssPath={cssPath}
        languageVersions={languageVersions}
        bodyClass="body-blog"
        rssLink={`/${lang}/rss.xml`}
        bigHeaderPage="blog"
    >
        <main className="blog-main">
            {page === 1 && article && <article className="article-main" style={{overflow: 'hidden'}}>
                <HTML content={article.content} lang={lang} />
            </article>}
            {posts.map(post => {
                const coatsOfArms = normalizeCoatsOfArms(post.data.coatOfArms);
                return <article key={post.name} className="post-list-entry">
                    {post.data.titleImage
                        ? <a className="post-list-entry-titleimage" href={getPostLink(post.name, lang)}><img src={getImageLink(post.data.titleImage, '1x')} /></a>
                        : <div className="post-list-entry-notitleimage" />}
                    <div className="post-list-entry-body">                        
                        <div className="post-list-entry-top">
                            <div className="post-list-entry-title">
                                <h2><a href={getPostLink(post.name, lang)}>{post.data.title}</a></h2>
                                <h4><time>{formatPostDate(post.name, lang)}</time></h4>
                            </div>
                            {coatsOfArms.length > 0 && <div className="post-list-entry-coatsofarms">
                                {coatsOfArms.map(coa => <img src={coa[0]} style={{'--width': Math.floor(coa[1]) + 'px'} as any} />)}
                            </div>}
                        </div>
                        {post.data.description && <p className="post-list-entry-description">
                            <HTML content={post.data.description} lang={lang} /> 
                        </p>}
                    </div>
                </article>
            })}
            <Pagination category={category} lang={lang} thisPage={page} totalPages={totalPages} />
        </main>
    </Layout>;
}
