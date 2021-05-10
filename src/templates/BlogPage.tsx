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
import {normalizeCoatsOfArms} from './util';

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
        rssLink={`/${lang}/rss.xml`}
        bigHeaderPage="blog"
    >
        <main className="blog-main">
            {lang === 'en' && <blockquote>
                As of May 2021, I am no longer updating the English version of this blog.  Over the past few
                years its popularity has lagged much behind the Russian version (itself quite a niche website as well),
                and translating all posts adds
                to the writing burden considerably.  I hope however that I can publish more in English (or even Finnish)
                eventually, but probably in some different format (for example a guide into some area of Finland,
                which I might eventually compile from these travel notes).
            </blockquote>}
            {lang === 'fi' && <blockquote>
                Tällä hetkellä en säännöllisesti kirjoita blogia suomeksi.  Tässä on vain muutama käännös, ja ulkoisia
                linkkejä tälle sivulle ei ole.  Tulevaisuudessa saatan kuitenkin kirjoittaa enemmän.
            </blockquote>}
            {posts.map(post => {
                const coatsOfArms = normalizeCoatsOfArms(post.data.coatOfArms);
                return <article key={post.name} className="post-list-entry">
                    {post.data.titleImage
                        ? <a className="post-list-entry-titleimage" href={getPostLink(post.name, lang)}><img src={post.data.titleImage.replace(/\.([^.]+)$/, '.1x.$1')} /></a>
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
                            <Content content={post.data.description} lang={lang} /> 
                        </p>}
                    </div>
                </article>
            })}
            <Pagination lang={lang} thisPage={page} totalPages={totalPages} />
        </main>
    </Layout>;
}
