/**
 * <MapSidePane>: Side pane for the map page, displaying either map's own markdown page or selected POI preview.
 */
import React from 'react';
import ReactImageGallery from 'react-image-gallery';
import {POI} from '../contentTypes';
import _ from '../l10n';

export interface MapSidePaneProps {
    loading: boolean;
    loadingError: boolean;
    lang: string;
    content: string;
    poiSelected: string | undefined;
    poiSelectedTitle: string | undefined;
    poi: POI | null;
}

export const MapSidePane = (props: MapSidePaneProps) => {
    const {content, lang, poiSelected, poiSelectedTitle, loading, loadingError, poi} = props;

    return <div className="map-side-pane">
        <div className="map-side-pane-inner">
            {poiSelected
                ? <div>
                    <h1><a href={`/${lang}/place/${poiSelected}/`}>{poiSelectedTitle}</a></h1>
                    {loading || !poi
                        ? <p className="loading"><i className="fas fa-circle-notch fa-spin" /></p>
                        : loadingError
                            ? <h2>Loading Error</h2>
                            : <div>
                                <p className="subtitle"><i>{poi.data.subtitle
                                    ? `${_(`type-${poi.data.type}`, lang)} • ${poi.data.subtitle}`
                                    : _(`type-${poi.data.type}`, lang)}</i></p>
                                <hr />
                                {/* Note that we explicitly use ReactImageGallery instead of ssrComponent() wrapper
                                    like for e.g. PlacePage; that's because MapSidePane is rendered by MapView which
                                    is already ssrComponent-wrapper */}
                                {poi.galleryPrepared && <ReactImageGallery
                                    items={poi.galleryPrepared}
                                    showPlayButton={false} showBullets={true} showIndex={true}
                                />}
                                <div><strong dangerouslySetInnerHTML={{__html: poi.data.description}} /></div>
                                <hr />
                                {poi.data.address &&
                                    <><b>{_('Address', lang)}</b>: <span dangerouslySetInnerHTML={{__html: poi.data.address}} /><br/></>}
                                {poi.data.seasonDescription &&
                                    <><b>{_('Season', lang)}</b>: <span dangerouslySetInnerHTML={{__html: poi.data.seasonDescription}} /><br/></>}
                                {poi.data.accessDescription &&
                                    <><b>{_('Access', lang)}</b>: <span dangerouslySetInnerHTML={{__html: poi.data.accessDescription}} /><br/></>}
                                <p><a href={`/${lang}/place/${poiSelected}/`}>{_('Continue reading', lang)}</a></p>
                            </div>
                    }
                </div>
                : <div dangerouslySetInnerHTML={{__html: content}} />}
        </div>
    </div>;
}
