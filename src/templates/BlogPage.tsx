/**
 * <BlogPage>: static blog page.
 */
import * as React from 'react';
import {Fragment} from 'react';
import {range} from 'lodash';
import {Post} from '../contentTypes';
import {Layout} from './Layout';
import {formatPostDate, getBlogLink, getPostLink} from '../generator/util';
import _ from '../l10n';
import {Content} from '../components/Content';
import {LANGUAGES} from '../const';

export interface BlogPageProps {
    lang: string;
    bundlePath: string;
    cssPath?: string;
    posts: Post[];
    page: number;
    totalPages: number;
}

const Pagination = (props: {lang: string, thisPage: number, totalPages: number}) => {
    const {lang, thisPage, totalPages} = props;
    if (totalPages < 2) {
        return null;
    }

    let pages: number[] = [];
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
            {thisPage !== 1 && <><a className="prev page-numbers" href={getBlogLink(thisPage - 1, lang)}><span
                className="screen-reader-text">Previous</span><i className="fas fa-arrow-left" /></a> </>}
            {pages.map(page => {
                if (!page) {
                    return <span key={page} className="page-numbers dots">… </span>;
                }
                if (page === thisPage) {
                    return <span key={page} aria-current="page" className="page-numbers current">{page} </span>;
                }
                return <Fragment key={page}> <a className="page-numbers" href={getBlogLink(page, lang)}><span
                    className="meta-nav screen-reader-text">Page </span>{page}</a> </Fragment>;
            })}
            {thisPage !== totalPages && <> <a className="next page-numbers" href={getBlogLink(thisPage + 1, lang)}><span
                className="screen-reader-text">Next</span><i className="fas fa-arrow-right" /></a></>}
        </div>
    </nav>;
};

export const BlogPage = (props: BlogPageProps) => {
    const {lang, bundlePath, cssPath, posts, page, totalPages} = props;
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
        activeHeaderLink="posts"
        rssLink={`/${lang}/rss.xml`}
    >
        <main className="post-main">
            <article>
                <div className="post-heading-no-pic blog-heading">
                    <div className="post-title">
                        <h1>{_('Blog', lang)}</h1>
                    </div>
                </div>
            </article>
            {posts.map(post =>
                <article key={post.name}>
                    <div className={post.data.titleImage ? 'post-heading' : 'post-heading-no-pic'}
                         style={post.data.titleImage ? {backgroundImage: `url(${post.data.titleImage})`, backgroundPosition: `50% ${post.data.titleImageOffsetY !== undefined ? post.data.titleImageOffsetY : 50}%`} : {}}>
                        <div className="post-title">
                            <h1><a href={getPostLink(post.name, lang)}>{post.data.title}</a></h1>
                            {post.data.titleDate && <h4><span className="time"><time>{post.data.titleDate}</time></span></h4>}
                            <h4>{_('Published on', lang)}: <time>{formatPostDate(post.name, lang)}</time></h4>
                        </div>
                    </div>
                    <hr />
                    <Content content={post.content} lang={lang} cut={getPostLink(post.name, lang)} />
                    <hr />
                </article>
            )}
            <Pagination lang={lang} thisPage={page} totalPages={totalPages} />
        </main>
    </Layout>;
}
