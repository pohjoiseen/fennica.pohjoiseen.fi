/**
 * <MapSidePane>: Side pane for the map page, displaying either map's own markdown page or selected POI preview.
 */
import React, {useEffect, useState, Fragment} from 'react';
import ReactImageGallery from 'react-image-gallery';
import {POI} from '../contentTypes';
import _ from '../l10n';

export interface MapSidePaneProps {
    lang: string;
    content: string;
    poiSelected: string | undefined;
    poiSelectedTitle: string | undefined;
}
interface MapSidePaneState {
    loading: boolean;
    loadingError: boolean;
    poiDisplayed: string | null;
    poi: POI | null;
}

export const MapSidePane = (props: MapSidePaneProps) => {
    const {content, lang, poiSelected, poiSelectedTitle} = props;
    const [state, setState] = useState<MapSidePaneState>({loading: false, loadingError: false, poiDisplayed: null, poi: null});
    const {loading, loadingError, poiDisplayed, poi} = state;

    // handle loading of pane data from statically generated JSONs
    useEffect(() => {
        if (poiDisplayed !== poiSelected && poiSelected && !loading) {
            const fetchFunction = async () => {
                setState({...state, loading: true});
                try {
                    const response = await fetch(`/${lang}/place/${poiSelected}.json`);
                    const json = await response.json();
                    setState({...state, poiDisplayed: poiSelected, poi: json});
                } catch (e) {
                    setState({...state, loading: false, loadingError: true});
                }
            }
            fetchFunction();
        }
    });

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
