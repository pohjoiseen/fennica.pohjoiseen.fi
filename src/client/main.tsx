/**
 * Client-side code entry point.  This is quite simple, we just re-hydrate all known SSR components according
 * to the type/props attributes.
 */
import * as React from 'react';
import {hydrate} from 'react-dom';
import {COMPONENT_MAP} from '../components/components';

// Styles (Leaflet, react-image-gallery, own)
import 'leaflet/dist/leaflet.css';
import 'react-image-gallery/styles/css/image-gallery.css';
import './style.css';

// https://stackoverflow.com/a/30106551
const b64DecodeUnicode = (str: string) => {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

const componentRoots = Array.from(document.querySelectorAll('.__ssr'));
for (let componentRoot of componentRoots) {
    const type = componentRoot.getAttribute('data-component-type');
    const props = JSON.parse(b64DecodeUnicode(componentRoot.getAttribute('data-component-props')!));
    componentRoot.removeAttribute('data-component-type');
    componentRoot.removeAttribute('data-component-props');
    const Component = COMPONENT_MAP[type!];
    if (Component) {
        hydrate(<Component {...props} />, componentRoot);
    }
}
