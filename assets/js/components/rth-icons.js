// rth-icons.js — ikon 🌳 untuk setiap RTH; ukuran ikon menunjukkan tingkat layanan.
// Klik ikon memanggil onClick(feature), biasanya untuk membuka panel samping RTH.

import { RTH_ICON_SIZE } from '../config.js';

export function createRthIcons(rthGeoJSON, onClick) {
  return L.layerGroup(rthGeoJSON.features.map(f => {
    const center = L.geoJSON(f).getBounds().getCenter();
    const size = RTH_ICON_SIZE[f.properties.tingkat] || 14;
    return L.marker(center, {
      pane: 'ico',
      keyboard: false,
      zIndexOffset: 1000,
      icon: L.divIcon({
        className: 'rth-ico',
        html: `<span style="font-size:${size}px">🌳</span>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      }),
    })
      .bindTooltip(f.properties.name || 'RTH tanpa nama', { direction: 'top', offset: [0, -size / 2] })
      .on('click', () => onClick(f));
  }));
}
