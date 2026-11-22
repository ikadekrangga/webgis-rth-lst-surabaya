// priority.js — halaman Versi 1: prioritas kebutuhan RTH per kelurahan.
// Memuat data, lalu menggambar peta tema (prioritas, kepadatan, akses RTH, LST),
// legenda, panel detail kelurahan, pencarian, dan ikon/panel RTH.
import { PATHS, BREAKS, COLORS } from '../config.js';
import { nf0, nf1, nf2, toTitle } from '../utils/format.js';
import { loadAll } from '../utils/data.js';
import { initRthPanel } from '../components/rth-panel.js';
import { createRthIcons } from '../components/rth-icons.js';

const [KEL, RTH, BOUNDS] = await loadAll([PATHS.kelurahanPriority, PATHS.rth, PATHS.rasterBounds]);
const PRIO = COLORS.prioritas;

const TEMA = {
  prioritas: { judul: 'Kelas prioritas', kelas: ['Rendah', 'Sedang', 'Tinggi'].map(k => ({ label: k, warna: PRIO[k] })),
               warna: p => PRIO[p.prioritas] },
  kepadatan: { judul: 'Kepadatan penduduk (jiwa/km²)', field: 'kepadatan', batas: BREAKS.kepadatan,
               warna3: ['#fee0d2', '#fc9272', '#de2d26'], fmt: nf0 },
  akses: { judul: 'Luas terjangkau RTH 700 m (%)', field: 'akses_pc', batas: BREAKS.akses,
           warna3: ['#f7fcb9', '#addd8e', '#31a354'], fmt: nf1 },
  lst: { judul: 'LST rata-rata (°C)', field: 'lst_mean', batas: BREAKS.lst,
         warna3: ['#91bfdb', '#ffffbf', '#fc8d59'], fmt: nf1 },
};
for (const [k, t] of Object.entries(TEMA)) {
  if (!t.field) continue;
  const v = KEL.features.map(f => f.properties[t.field] ?? 0);
  const lo = [Math.min(...v), ...t.batas], hi = [...t.batas, Math.max(...v)];
  t.kelas = t.warna3.map((w, i) => ({ label: `${t.fmt.format(lo[i])} – ${t.fmt.format(hi[i])}`, warna: w }));
  t.warna = p => { const x = p[t.field] ?? 0; return t.warna3[x <= t.batas[0] ? 0 : x <= t.batas[1] ? 1 : 2]; };
}

const map = L.map('map', { zoomSnap: 0.25, minZoom: 10, maxZoom: 17, maxBounds: L.latLngBounds(BOUNDS.basemap).pad(0.15), attributionControl: true });
const bukaRTH = initRthPanel(map, KEL);
map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
const basemap = L.imageOverlay(PATHS.basemap, BOUNDS.basemap, { attribution: '© OpenStreetMap contributors', opacity: 0.9 }).addTo(map);
const lstImg = L.imageOverlay(PATHS.lst, BOUNDS.lst, { opacity: 0.85, attribution: 'LST: USGS Landsat 8 C2 L2' });
map.createPane('rth'); map.getPane('rth').style.zIndex = 450;
const rthLayer = L.geoJSON(RTH, {
  pane: 'rth',
  style: { color: '#0b4d1f', weight: 1.2, fillColor: '#2e9e4f', fillOpacity: 0.75 },
  onEachFeature: (f, l) => {
    const p = f.properties;
    l.on('click', () => bukaRTH(f));
  }
});

map.createPane('ico'); map.getPane('ico').style.zIndex = 650;
const rthIco = createRthIcons(RTH, bukaRTH).addTo(map);
let tema = 'prioritas', pilih = null;
const kelLayer = L.geoJSON(KEL, {
  style: f => gaya(f),
  onEachFeature: (f, l) => {
    l.on({
      mouseover: e => { if (e.target !== pilih) e.target.setStyle({ weight: 2.5, color: '#111' }); },
      mouseout: e => { if (e.target !== pilih) kelLayer.resetStyle(e.target); },
      click: e => tandai(e.target),
    });
    l.bindTooltip(toTitle(f.properties.kel), { sticky: true, direction: 'top' });
  }
}).addTo(map);
function gaya(f) {
  return { color: '#444', weight: 0.6, fillColor: TEMA[tema].warna(f.properties), fillOpacity: lstImg._map ? 0.15 : 0.78 };
}
map.fitBounds(kelLayer.getBounds(), { padding: [10, 10] });
L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

function tandai(l) {
  if (pilih) kelLayer.resetStyle(pilih);
  pilih = l;
  l.setStyle({ weight: 3.5, color: '#0f5c7a' });
  l.bringToFront();
  isiDetail(l.feature.properties);
}

function baris(a, b) { return `<tr><td>${a}</td><td>${b}</td></tr>`; }
function isiDetail(p) {
  const tingkat = [['Kota (5 km)', 'jk_Kota_pc'], ['Kecamatan (2,5 km)', 'jk_Kecamatan_pc'], ['Kelurahan (700 m)', 'jk_Kelurahan_pc'], ['RW (350 m)', 'jk_RW_pc'], ['RT (100 m)', 'jk_RT_pc']];
  document.getElementById('detail').innerHTML = `
    <h3>${toTitle(p.kel)}</h3>
    <div class="kec">Kecamatan ${toTitle(p.kec)} · prioritas <span class="pill" style="background:${PRIO[p.prioritas]}">${p.prioritas}</span></div>
    <table>
      ${baris('Penduduk', nf0.format(p.Total) + ' jiwa')}
      ${baris('Luas', nf2.format(p.luas_km2) + ' km²')}
      ${baris('Kepadatan', nf0.format(p.kepadatan) + ' jiwa/km² · skor ' + p.skor_kepadatan)}
      ${baris('LST rata-rata', nf1.format(p.lst_mean) + ' °C · skor ' + p.skor_lst)}
      ${baris('LST min – maks', nf1.format(p.lst_min) + ' – ' + nf1.format(p.lst_max) + ' °C')}
      ${baris('Akses RTH 700 m', nf1.format(p.akses_pc) + '% · skor ' + p.skor_akses)}
      ${baris('<b>Indeks prioritas</b>', '<b>' + p.indeks + ' dari 9</b>')}
    </table>
    <h2 style="margin:12px 0 4px">Luas terjangkau per tingkat RTH</h2>
    <table>${tingkat.map(([a, k]) => baris(a, nf1.format(p[k] ?? 0) + '%')).join('')}</table>`;
}

function legenda() {
  const t = TEMA[tema];
  let h = `<div style="font-weight:600;margin-bottom:4px">${t.judul}</div>` +
    t.kelas.slice().reverse().map(k => `<div class="legend-row"><span class="sw" style="background:${k.warna}"></span>${k.label}</div>`).join('');
  if (document.getElementById('o-lst').checked)
    h += `<div style="font-weight:600;margin:10px 0 4px">Citra LST 30 m (°C)</div><div class="ramp"></div><div class="ramp-l"><span>≤ 30,2</span><span>35,8</span><span>≥ 41,5</span></div>`;
  if (document.getElementById('o-ico').checked)
    h += `<div class="legend-row" style="margin-top:8px"><span style="width:22px;text-align:center">🌳</span>RTH publik (ukuran ikon = tingkat layanan)</div>`;
  if (document.getElementById('o-rth').checked)
    h += `<div class="legend-row" style="margin-top:8px"><span class="sw" style="background:#2e9e4f;border-color:#0b4d1f"></span>RTH publik (OSM)</div>`;
  document.getElementById('legend').innerHTML = h;
}

function ringkas() {
  const n = { Tinggi: 0, Sedang: 0, Rendah: 0 };
  KEL.features.forEach(f => n[f.properties.prioritas]++);
  document.getElementById('stats').innerHTML = ['Tinggi', 'Sedang', 'Rendah']
    .map(k => `<div class="stat" style="--c:${PRIO[k]}"><b>${n[k]}</b><span>${k}</span></div>`).join('');
}



document.querySelectorAll('input[name=tema]').forEach(r => r.addEventListener('change', e => {
  tema = e.target.value; kelLayer.setStyle(gaya); if (pilih) pilih.setStyle({ weight: 3.5, color: '#0f5c7a' }); legenda();
}));
document.getElementById('o-rth').addEventListener('change', e => { e.target.checked ? rthLayer.addTo(map) : rthLayer.remove(); legenda(); });
document.getElementById('o-lst').addEventListener('change', e => {
  e.target.checked ? lstImg.addTo(map) : lstImg.remove();
  kelLayer.setStyle(gaya); if (pilih) pilih.setStyle({ weight: 3.5, color: '#0f5c7a' }); legenda();
});
document.getElementById('o-lsto').addEventListener('input', e => lstImg.setOpacity(+e.target.value));
document.getElementById('o-ico').addEventListener('change', e => { e.target.checked ? rthIco.addTo(map) : rthIco.remove(); legenda(); });
document.getElementById('o-bm').addEventListener('change', e => { e.target.checked ? basemap.addTo(map) : basemap.remove(); });

const idx = {};
KEL.features.forEach(f => { idx[`${toTitle(f.properties.kel)} — ${toTitle(f.properties.kec)}`] = f; });
document.getElementById('daftar').innerHTML = Object.keys(idx).sort().map(k => `<option value="${k}"></option>`).join('');
document.getElementById('cari').addEventListener('submit', e => {
  e.preventDefault();
  const q = document.getElementById('q').value.trim().toLowerCase();
  const key = Object.keys(idx).find(k => k.toLowerCase() === q) || Object.keys(idx).find(k => k.toLowerCase().startsWith(q));
  const msg = document.getElementById('msg');
  if (!q || !key) { msg.textContent = 'Kelurahan tidak ditemukan. Periksa ejaan atau pilih dari daftar.'; return; }
  msg.textContent = '';
  kelLayer.eachLayer(l => { if (l.feature === idx[key]) { map.fitBounds(l.getBounds(), { maxZoom: 15, padding: [30, 30] }); tandai(l); } });
});

ringkas(); legenda();
// tampilkan contoh detail saat halaman dibuka: kelurahan dengan indeks tertinggi dan kepadatan terbesar
const awal = KEL.features.slice().sort((a, b) => b.properties.indeks - a.properties.indeks || b.properties.kepadatan - a.properties.kepadatan)[0];
kelLayer.eachLayer(l => { if (l.feature === awal) tandai(l); });
