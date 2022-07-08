
/**
 * <HTML>: display a large HTML content block.
 * What this does apart from dangerouslySetInnerHTML:
 * - converts <!--gallery--><img ...><img ...><!--/gallery--> constructions into actual
 *   galleries.  This is a bit awkward way to do it but makes it quite convenient to add galleries in content markdown
 *   files wherever necessary.
 * - converts <!--map mapid-->...some wrapped HTML...<!--/map--> to specified interactive map.  Wrapped content
 *   will be displayed to the right of the map.  Wrapped content is optional but still the entire "map" tag must
 *   be written out in full (<!--map mapid--><!--/map-->)
 * - if cut props is set, and there is a <!--more--> construction in the body, then everything after it is not
 *   displayed, and a link is displayed instead of it.
 *   NOTE: <!--more--> feature is not used anymore as of May 2021 (in favor of explicit post description fields),
 *   code for it here kept so far.
 */
import * as React from 'react';
import cheerio from 'cheerio';
import {mapData} from './content';
import _ from '../l10n';

export interface HTMLProps {
    content: string;
    lang: string;
    cut?: string;
}

export const HTML = ({content, lang, cut}: HTMLProps) => {
    const result = [];

    // if there is a cut mark and cut is requested, cut off there
    const cutIndex = content.indexOf('<!--more-->');
    if (cutIndex !== -1 && cut) {
        content = content.substr(0, cutIndex);
    }

    // splice in galleries and maps, for which we use rudimentary markup
    // suppose we have input:
    //   bla bla <!--gallery-->foo bar<!--/gallery--> bla bla <!--map coolmap-->baz foo<!--/map--> bla bla
    // the .split() will turn it to:
    //   ['bla bla ', 'gallery', '', 'foo bar', 'gallery', ' bla bla ', 'map', ' coolmap', 'baz foo', 'map', ' bla bla']
    // so the array is: normal text, opening "tag", parameters, wrapped text, closing "tag", normal text, ...
    // this means galleries and maps cannot be wrapped into one another, but that's fine with us 
    const split = content.split(/<!--(gallery|map)(\s*.*?)-->(.*?)<!--\/(gallery|map)-->/s);
    // handle in blocks of five elements
    for (let k = 0; k + 1 < split.length; k += 5) {
        result.push(<div key={k} dangerouslySetInnerHTML={{__html: split[k]}} />);
        const tag = split[k + 1], params = split[k + 2].trim(), wrap = split[k + 3].trim();
        // (ignore split[k + 4] which should be equal to split[k + 1])
        switch (tag) {
            case 'gallery':
                const $ = cheerio.load(wrap, {decodeEntities: false});
                result.push(<div className="glider-contain" data-id={k} key={'glider' + k}>
                    <div className="glider">
                        {$('img').map((k, el) => <div key={k} className="glider-image">
                            <a className="glider-external-link" href={$(el).parent().attr('href')}><i className="fas fa-external-link-alt" /></a>
                            <div className="glider-image-wrap">
                                {/* Note: no width on purpose */}
                                <img
                                    src={$(el).attr('src')}
                                    srcSet={$(el).attr('srcset')}
                                />
                                {$(el).attr('alt') && <p>{$(el).attr('alt')}</p>}
                            </div>
                        </div>)}
                    </div>
                    <button id={'glider-prev-' + k} role="button" aria-label={_('Previous')} className="glider-prev"><i className="fa fa-chevron-left"></i></button>
                    <button id={'glider-next-' + k} role="button" aria-label={_('Next')} className="glider-next"><i className="fa fa-chevron-right"></i></button>
                    <div id={'glider-dots-' + k} className="glider-dots" />
                </div>);
                break;
                
            case 'map':
                if (!mapData[lang] || !mapData[lang][params || 'index']) {
                    throw new Error(`Map '${params}' is not defined for language ${lang}`)
                }
                const geoJSONs = mapData[lang][params || 'index'];
                result.push(<div key={k} className={`mapview-wrapper ${wrap ? 'with-aside' : 'no-aside'}`}>
                    <div className="leaflet-container" data-geojson={JSON.stringify(geoJSONs)} />
                    {wrap && <div className="mapview-aside" dangerouslySetInnerHTML={{__html: wrap}} />}
                </div>);
                break;
        }
    }
    // final part
    result.push(<div key={-1} dangerouslySetInnerHTML={{__html: split[split.length - 1]}} />);

    // if had cut before, add a link
    if (cutIndex !== -1 && cut) {
        result.push(<p key="cut"><a href={cut}>{_('Continue reading', lang)}</a></p>);
    }

    return <>{result}</>;
}
