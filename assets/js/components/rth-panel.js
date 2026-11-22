// rth-panel.js — panel samping yang muncul saat ikon atau poligon RTH diklik.
// Pemakaian: const openRthPanel = initRthPanel(map, kelurahanGeoJSON);
// Butuh elemen <div id="drawer"> di HTML dan pane Leaflet bernama 'ico'.

import { nf0, nf2, toTitle } from '../utils/format.js';

export function initRthPanel(map, KEL) {
  const JENIS = { park: 'Taman', recreation_ground: 'Lapangan / area rekreasi', forest: 'Hutan kota' };
  function dalamPoligon(pt, geom) {
    const [x, y] = pt, polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    return polys.some(poly => { let ins = false; poly.forEach((ring, ri) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } if (ri === 0) ins = c; else if (c) ins = false; }); return ins; });
  }
  const drawer = document.getElementById('drawer');
  let rthSorot = null;
  function tutupRTH() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); if (rthSorot) { map.removeLayer(rthSorot); rthSorot = null; } }
  function bukaRTH(f) {
    const p = f.properties, c = L.geoJSON(f).getBounds().getCenter();
    const kel = KEL.features.find(k => dalamPoligon([c.lng, c.lat], k.geometry));
    const kp = kel ? kel.properties : null;
    document.getElementById('dr-nama').textContent = p.name || 'RTH tanpa nama';
    document.getElementById('dr-lv').textContent = `RTH tingkat ${p.tingkat}`;
    const row = (a, b) => `<tr><td>${a}</td><td>${b}</td></tr>`;
    document.getElementById('dr-body').innerHTML = `
      <table>
        ${row('Jenis', JENIS[p.leisure] || JENIS[p.landuse] || p.leisure || p.landuse || '-')}
        ${row('Luas', nf2.format(p.luas_ha) + ' ha')}
        ${row('Tingkat layanan', p.tingkat)}
        ${row('Radius layanan', nf0.format(p.radius_m) + ' m')}
        ${kp ? row('Kelurahan', toTitle(kp.kel)) + row('Kecamatan', toTitle(kp.kec)) + row('Penduduk kelurahan', nf0.format(kp.Total) + ' jiwa') : row('Lokasi', 'di luar batas kelurahan')}
      </table>
      <button class="btn2" id="dr-zoom">Perbesar ke RTH ini</button>
      <p class="ket">Radius layanan mengikuti Permen ATR/BPN No. 14 Tahun 2022 berdasarkan luas RTH. Sumber poligon: OpenStreetMap.</p>`;
    if (rthSorot) map.removeLayer(rthSorot);
    rthSorot = L.geoJSON(f, { pane: 'ico', interactive: false, style: { color: '#0b4d1f', weight: 3, fillColor: '#2e9e4f', fillOpacity: 0.35, dashArray: '5 4' } }).addTo(map);
    document.getElementById('dr-zoom').onclick = () => map.fitBounds(L.geoJSON(f).getBounds(), { maxZoom: 17, padding: [60, 60] });
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
  }
  document.getElementById('dr-x').addEventListener('click', tutupRTH);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') tutupRTH(); });

  return bukaRTH;
}
