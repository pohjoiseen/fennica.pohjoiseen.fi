/**
 * <PostPage>: static post page.
 */
import * as React from 'react';
import {Post} from '../contentTypes';
import {Layout} from './Layout';
import {formatPostDate, getLanguageVersionURLs, getPostLink} from '../generator/util';
import _ from '../l10n';
import {HTML} from '../generator/HTML';
import {PUBLIC_BASE, COATOFARMS_DEFAULT_SIZE} from '../const';
import {normalizeCoatsOfArms} from './util';

export interface PostPageProps {
    lang: string;
    bundlePath: string;
    cssPath?: string;
    post: Post;
    prev?: Post;
    next?: Post;
}

export const PostPage = (props: PostPageProps) => {
    const {lang, bundlePath, cssPath, post, prev, next} = props;
    const prevPath = prev ? getPostLink(prev.name, lang) : undefined;
    const nextPath = next ? getPostLink(next.name, lang) : undefined;
    const coatsOfArms = normalizeCoatsOfArms(post.data.coatOfArms);
    const useTitleImage = post.data.titleImage && !post.data.titleImageInText;
    
    return <Layout
        title={post.data.title}
        lang={lang}
        bundlePath={bundlePath}
        cssPath={cssPath}
        titleImage={PUBLIC_BASE + post.data.titleImage}
        languageVersions={getLanguageVersionURLs(post.name, 'posts')}
        bodyClass="body-post"
        prevPath={prevPath}
        prevTitle={prev ? prev.data.title : undefined}
        nextPath={nextPath}
        nextTitle={next ? next.data.title : undefined}
    >
        <div className={useTitleImage ? 'post-heading' : 'post-heading-no-pic'}
                style={useTitleImage ? {backgroundImage: `url(${post.data.titleImage})`, backgroundPosition: `50% ${post.data.titleImageOffsetY !== undefined ? post.data.titleImageOffsetY : 50}%`} : {}}>
            {coatsOfArms.length > 0 && <div className="post-heading-coatsofarms">
                {coatsOfArms.map(coa => <img src={coa[0]} style={{'--width': Math.floor(coa[1]) + 'px'} as any} />)}
            </div>}
            <div className="post-title">
                <h1>{post.data.title}</h1>
                {post.data.date && <h4><span className="time"><time>{post.data.date}</time></span></h4>}
                {prev && <h4><span className="prev">{_('Previous', lang)}: <a href={prevPath}>{prev.data.title}</a></span></h4>}
                {next && <h4><span className="next">{_('Next', lang)}: <a href={nextPath}>{next.data.title}</a></span></h4>}
            </div>
        </div>
        <main className="post-main">
            <article>
                <hr />
                <HTML content={post.content} lang={lang} />
                <h4>{_('Published on', lang)}: <time>{formatPostDate(post.name, lang)}</time></h4>
            </article>
        </main>
    </Layout>;
}
