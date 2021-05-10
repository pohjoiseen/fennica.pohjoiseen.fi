
/**
 * <Content>: display a large HTML content block.
 * What this does apart from dangerouslySetInnerHTML:
 * - converts <!--gallery--><img ...><img ...><!--/gallery--> constructions into actual
 *   galleries.  This is a bit awkward way to do it but makes it quite convenient to add galleries in content markdown
 *   files wherever necessary.
 * - if cut props is set, and there is a <!--more--> construction in the body, then everything after it is not
 *   displayed, and a link is displayed instead of it.
 *   NOTE: <!--more--> feature is not used anymore as of May 2021 (in favor of explicit post description fields),
 *   code for it here kept so far.
 */
import * as React from 'react';
import cheerio from 'cheerio';
import {prepareGalleryItems} from '../generator/content';
import {ssrComponent} from '../templates/ssrComponent';
import {getContentDir} from '../generator/paths';
import _ from '../l10n';

export interface ContentProps {
    content: string;
    lang: string;
    cut?: string;
}

export const Content = ({content, lang, cut}: ContentProps) => {
    const result = [];

    // if there is a cut mark and cut is requested, cut off there
    const cutIndex = content.indexOf('<!--more-->');
    if (cutIndex !== -1 && cut) {
        content = content.substr(0, cutIndex);
    }

    // this splits content into blocks of (normal markup) -- (gallery content) -- (normal markup) -- (gallery content)...
    // normal markup blocks are just rendered with dangerouslySetInnerHTML, gallery content is parsed back from HTML
    // and displayed as a ReactImageGallery component instead
    const split = content.split(/<!--gallery-->(.*?)<!--\/gallery-->/s);
    let isGallery = false;
    for (let k in split) {
        const part = split[k];
        if (!isGallery) {
            result.push(<div key={k} dangerouslySetInnerHTML={{__html: part}} />);
        } else {
            const $ = cheerio.load(part, {decodeEntities: false});
            const items: {url: string, title: string}[] = [];
            // note that at this point, fixupImages() has already been executed, therefore image srcs are already
            // correctly resolved and .1x version is substituted.  So we have a bit of a hack to go back to the
            // original file
            $('img').each((k, el) => {
                if (el.type === 'tag') {  // always true, make TS happy
                    items.push({url: '.' + el.attribs.src.replace(/.1x.([^.]+)$/, '.$1'), title: el.attribs.alt});
                }
            });
            result.push(ssrComponent('reactImageGallery', {
                items: prepareGalleryItems(items, getContentDir()),
                showPlayButton: false,
                showIndex: true,
                showBullets: true,
            }, k));
        }
        isGallery = !isGallery;
    }

    // if had cut before, add a link
    if (cutIndex !== -1 && cut) {
        result.push(<p key="cut"><a href={cut}>{_('Continue reading', lang)}</a></p>);
    }

    return <>{result}</>;
}
