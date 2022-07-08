/**
 * Client-side code entry point.  We use client JS only for image galleries (via Glider.js) and maps (via Leaflet).
 * Originally implemented as server-rendered React components but simplified to basic JS, don't really need React
 * in this kind of project.
 */

// Styles (Leaflet, Glider.js, own)
import 'leaflet/dist/leaflet.css';
import 'glider-js/glider.css';
import './style.css';

import Glider from 'glider-js';
import {initMap} from './maps';

// Init image galleries
document.querySelectorAll('.glider-contain').forEach(galleryRoot => {
    const galleryRootEl = galleryRoot as HTMLElement;
    const id = galleryRootEl.dataset.id;
    new Glider(galleryRootEl.querySelector('.glider') as HTMLElement, {
        slidesToShow: 1,
        scrollLock: true,
        draggable: true,
        dots: '#glider-dots-' + id,
        arrows: {
            prev: '#glider-prev-' + id,
            next: '#glider-next-' + id
        }
    });
});
       
// Init maps
document.querySelectorAll('.leaflet-container')
    .forEach(leafletRoot => initMap(leafletRoot as HTMLElement));