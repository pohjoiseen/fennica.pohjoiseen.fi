/**
 * <PostPage>: static post page.
 */
import * as React from 'react';
import {Post} from '../contentTypes';
import {Layout} from './Layout';
import {formatPostDate, getLanguageVersionURLs, getPostLink} from '../generator/util';
import _ from '../l10n';
import {Content} from '../components/Content';
import {PUBLIC_BASE} from '../const';

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

    return <Layout
        title={post.data.title}
        lang={lang}
        bundlePath={bundlePath}
        cssPath={cssPath}
        titleImage={PUBLIC_BASE + post.data.titleImage}
        languageVersions={getLanguageVersionURLs(post.name, 'posts')}
        bodyClass="body-post"
        activeHeaderLink="posts"
        prevPath={prevPath}
        prevTitle={prev ? prev.data.title : undefined}
        nextPath={nextPath}
        nextTitle={next ? next.data.title : undefined}
    >
        <main className="post-main">
            <article>
                <div className={post.data.titleImage ? 'post-heading' : 'post-heading-no-pic'}
                     style={post.data.titleImage ? {backgroundImage: `url(${post.data.titleImage})`, backgroundPosition: `50% ${post.data.titleImageOffsetY !== undefined ? post.data.titleImageOffsetY : 50}%`} : {}}>
                    {post.data.titleExtraHtml ? <div className="post-heading-extra" dangerouslySetInnerHTML={{__html: post.data.titleExtraHtml}} /> : null}
                    <div className="post-title">
                        <h1>{post.data.title}</h1>
                        {post.data.titleDate && <h4><span className="time"><time>{post.data.titleDate}</time></span></h4>}
                        {prev && <h4><span className="prev">{_('Previous', lang)}: <a href={prevPath}>{prev.data.title}</a></span></h4>}
                        {next && <h4><span className="next">{_('Next', lang)}: <a href={nextPath}>{next.data.title}</a></span></h4>}
                    </div>
                </div>
                <hr />
                <Content content={post.content} lang={lang} />
                <h4>{_('Published on', lang)}: <time>{formatPostDate(post.name, lang)}</time></h4>
            </article>
        </main>
    </Layout>;
}
