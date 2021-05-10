/**
 * <ArticlePage>: static article page.
 */
import * as React from 'react';
import {Article} from '../contentTypes';
import {Layout} from './Layout';
import {getLanguageVersionURLs} from '../generator/util';
import _ from '../l10n';
import {Content} from '../components/Content';

export interface ArticlePageProps {
    lang: string;
    bundlePath: string;
    cssPath?: string;
    article: Article;
    prev?: Article;
    next?: Article;
}

export const ArticlePage = (props: ArticlePageProps) => {
    const {lang, bundlePath, cssPath, article, prev, next} = props;
    const prevPath = prev ? (prev.name === 'index' ? `/${lang}/article/` : `/${lang}/article/${prev.name}`) : undefined;
    const nextPath = next ? (next.name === 'index' ? `/${lang}/article/` : `/${lang}/article/${next.name}`) : undefined;
    let bigHeaderPage = undefined
    if (article.name === 'about' || article.name === 'contents') {
        bigHeaderPage = article.name
    }
    return <Layout
        title={article.data.title}
        lang={lang}
        bundlePath={bundlePath}
        cssPath={cssPath}
        languageVersions={getLanguageVersionURLs(article.name, 'articles')}
        bodyClass="body-article"
        prevPath={prevPath}
        prevTitle={prev ? prev.data.title : undefined}
        nextPath={nextPath}
        nextTitle={next ? next.data.title : undefined}
        bigHeaderPage={bigHeaderPage}
    >
        <main>
            <h1 className="article-title">{article.data.title}</h1>
            <hr />
            <article className="article-main">
                <Content content={article.content} lang={lang} />
                {article.data.updated && <p><i>{_('Up to date as of', lang)}: {article.data.updated}</i></p>}
            </article>
        </main>
    </Layout>;
}
