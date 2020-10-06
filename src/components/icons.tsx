import L, {DivIcon, Icon} from 'leaflet';

export const ICONS: {[type: string]: Icon | DivIcon} = {
    city: L.divIcon({
        html: '<i class="fas fa-city" style="color: #fff;"></i>',
        iconSize: [22, 22],
        iconAnchor: [10, 22],
        popupAnchor: [0, -11],
    }),
    'urbanarea-major': L.divIcon({
        html: '<i class="fas fa-city" style="color: #fff;"></i>',
        iconSize: [22, 22],
        iconAnchor: [10, 22],
        popupAnchor: [0, -11],
    }),
    'national-park': L.divIcon({
        html: '<i class="fas fa-flag" style="color: #fff;"></i>',
        iconSize: [22, 22],
        iconAnchor: [10, 22],
        popupAnchor: [0, -11],
    }),
    island: L.divIcon({
        html: '<i class="fas fa-flag" style="color: #66c;"></i>',
        iconSize: [22, 22],
        iconAnchor: [10, 22],
        popupAnchor: [0, -11],
    }),
    lighthouse: L.divIcon({
        html: '<i class="fas fa-chess-rook" style="color: #aaa;"></i>',
        iconSize: [22, 22],
    }),
    'exercise-track': L.divIcon({
        html: '<i class="fas fa-city" style="color: #fff;"></i>',
        iconSize: [22, 22],
        iconAnchor: [10, 22],
        popupAnchor: [0, -11],
    }),
};

