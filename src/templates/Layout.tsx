/**
 * <Layout>: Fennica top-level layout, including <html>, <head>, <body>
 */
import * as React from 'react';
import {ReactNode} from 'react';
import * as fs from 'fs';
import _ from '../l10n';
import {ABOUT_ARTICLE, AUTHOR, COPYRIGHT, FAVICON, FOOTER_HREF, GOOGLE_ANALYTICS_ID, MAIN_TITLE} from '../const';

const ga = fs.readFileSync(__dirname + '/ga.js', {encoding: 'utf8'});

export interface LayoutProps {
    title?: string;
    description?: string;
    published?: Date;
    isOpenGraphArticle?: string;
    titleImage?: string;
    lang: string;
    bundlePath: string;
    cssPath?: string;
    languageVersions: {[lang: string]: string};
    parentPath?: string;
    prevPath?: string;
    nextPath?: string;
    prevTitle?: string;
    nextTitle?: string;
    noindex?: boolean;
    rssLink?: string;
    bodyClass: string;
    activeHeaderLink: 'maps' | 'pois' | 'posts' | 'articles' | 'about';
    noFooter?: boolean;
    children: ReactNode;
}

export const Layout = (props: LayoutProps) => {
    const {title, description, published, isOpenGraphArticle, titleImage, lang, bundlePath, cssPath, languageVersions,
        parentPath, prevPath, nextPath, prevTitle, nextTitle, noindex, rssLink, bodyClass, activeHeaderLink, noFooter, children} = props;

    return <html lang={lang} prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb#">
    <head>
        {/* basic prolog */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <base href="/static/" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link href="https://fonts.gstatic.com/" crossOrigin="crossOrigin" rel="preconnect" />

        {/* external (font) CSS */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=PT+Sans:400,400i,700,700i&amp;subset=cyrillic" />
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.14.0/css/all.css" />
        {cssPath && <link rel="stylesheet" href={cssPath} />}

        {/* <title>, meta description */}
        <title>{title ? `${title} - ${MAIN_TITLE}` : MAIN_TITLE}</title>
        {description && <meta name="description" content={description} />}

        {/* rel=alternate links for languages, rel=canonical */}
        {Object.keys(languageVersions).map(lang => <link key={lang} rel="alternate" hrefLang={lang} href={languageVersions[lang]} />)}
        <link rel="canonical" href={languageVersions[lang]} />

        {/* RSS if available */}
        {rssLink && <link rel="alternate" type="application/rss+xml" title={title ? `${title} - ${MAIN_TITLE}` : MAIN_TITLE} href={rssLink} />}

        {/* Google Analytics inline script */}
        <script type="text/javascript" data-cfasync="false" dangerouslySetInnerHTML={{__html: ga.replace(/%GA-ID%/g, GOOGLE_ANALYTICS_ID)}} />

        {/* favicons */}
        <link rel="icon" href={FAVICON} />
        <link rel="apple-touch-icon-precomposed" href={FAVICON} />
        <meta name="msapplication-TileImage" content={FAVICON} />

        {/* OpenGraph */}
        <meta property="og:site_name" content={MAIN_TITLE} />
        {title && <meta property="og:title" content={title} />}
        <meta property="og:url" content={languageVersions[lang]} />
        {isOpenGraphArticle && <>
            <meta property="og:type" content="article" />
            {published && <meta property="article:published_time" content={published.toISOString()} />}
            <meta property="article:author" content={AUTHOR} />
        </>}
        {description && <meta property="og:description" content={description} />}
        {titleImage && <meta property="og:image" content={titleImage} />}
        <meta itemProp="author" content={AUTHOR} />
        {title && <meta name="twitter:title" content={title} />}
        <meta name="twitter:url" content={languageVersions[lang]} />
        {description && <meta name="twitter:description" content={description} />}
        {titleImage && <>
            <meta name="twitter:card" content="summary_large_image" />
            <meta property="twitter:image" content={titleImage} />
        </>}

        {/* noindex */}
        {noindex && <meta name="robots" content="noindex, follow" />}
    </head>

    <body className={bodyClass}>
    <header role="banner">
        <a className="title-link" href="/">
            <h1 className="main-title"><img alt="logo" src="/static/sight-icon.png" /><span>Encyclopaedia</span> <span>Fennica</span></h1>
            <div className="note">Beta</div>
        </a>
        {false && <nav>
            <a href={`/${lang}/map/espoo/`} className={activeHeaderLink === 'maps' ? 'active' : ''}>{_('Maps', lang)}</a>
            &nbsp;|&nbsp;
            <a href={`/${lang}/place/`} className={activeHeaderLink === 'pois' ? 'active' : ''}>{_('Places', lang)}</a>
            <hr />
            <a href={`/${lang}/article/`} className={activeHeaderLink === 'articles' ? 'active' : ''}>{_('Articles', lang)}</a>
            &nbsp;|&nbsp;
            <a href={`/${lang}/`} className={activeHeaderLink === 'posts' ? 'active' : ''}>{_('Blog', lang)}</a>
            &nbsp;|&nbsp;
            <a href={`/${lang}/article/${ABOUT_ARTICLE}/`} className={activeHeaderLink === 'about' ? 'active' : ''}>{_('About', lang)}</a>
        </nav>}
        <nav>
            {languageVersions['en']
                ? <a href={languageVersions['en']} className={lang === 'en' ? 'active' : ''}>ENG</a>
                : <span className="muted">ENG</span>}
            <hr />
            {languageVersions['ru']
                ? <a href={languageVersions['ru']} className={lang === 'ru' ? 'active' : ''}>RUS</a>
                : <span className="muted">RUS</span>}
        </nav>
    </header>

    {children}

    {!noFooter && <footer>
        {(prevPath || nextPath) && <p>
            {prevPath && <>
                <a href={prevPath}><i className="fas fa-arrow-left" /></a>
                &nbsp;
                <a href={prevPath} className="text">{prevTitle}</a>
            </>}
            {prevPath && nextPath && '&nbsp;| '}
            {nextPath && <>
                <a href={nextPath} className="text">{nextTitle}</a>
                &nbsp;
                <a href={nextPath}><i className="fas fa-arrow-right" /></a>
            </>}
        </p>}
        <p>
            {COPYRIGHT} <a href={FOOTER_HREF}>{AUTHOR}</a>{' '}
            <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/deed.en">CC BY-NC-SA</a>
        </p>
    </footer>}

    {/* webpacked js */}
    <script type="text/javascript" src={bundlePath} />

    </body>
    </html>;
}
