// analysis.js — halaman Versi 2: hubungan jarak ke RTH, LST, dan penduduk.
// Memuat data, lalu menggambar peta tema (level kelurahan/kecamatan), ringkasan temuan,
// grafik LST per kelas jarak, diagram pencar, tabel kecamatan, dan ikon/panel RTH.
import { PATHS, BREAKS } from '../config.js';
import { nf0, nf1, nf2, nfr, toTitle } from '../utils/format.js';
import { loadAll } from '../utils/data.js';
import { initRthPanel } from '../components/rth-panel.js';
import { createRthIcons } from '../components/rth-icons.js';

const [KEL, KEC, RTH, ST, BOUNDS] = await loadAll([
  PATHS.kelurahanAnalysis, PATHS.kecamatanAnalysis, PATHS.rth, PATHS.analysisStats, PATHS.rasterBounds,
]);

const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const tip = document.getElementById('tip');
function showTip(e, html) { tip.innerHTML = html; tip.style.display = 'block'; const x = e.clientX + 14, y = e.clientY + 14; tip.style.left = Math.min(x, innerWidth - tip.offsetWidth - 8) + 'px'; tip.style.top = Math.min(y, innerHeight - tip.offsetHeight - 8) + 'px'; }
function hideTip() { tip.style.display = 'none'; }

// ---------- kelas tema ----------
function tertil(vals) { const s = vals.slice().sort((a, b) => a - b); return [s[Math.floor(s.length / 3)], s[Math.floor(2 * s.length / 3)]]; }
const DEF = {
  jarak: { judul: 'Jarak rata-rata ke RTH (m)', field: 'jarak_m', batas: () => ST.jenks_jarak, w: ['#1a9850', '#fee08b', '#d73027'], fmt: nf0, ket: 'Kelas Jenks' },
  lst: { judul: 'LST rata-rata (°C)', field: 'lst_mean', batas: () => ST.jenks_lst, w: ['#91bfdb', '#ffffbf', '#fc8d59'], fmt: nf1, ket: 'Kelas Jenks' },
  kepadatan: { judul: 'Kepadatan penduduk (jiwa/km²)', field: 'kepadatan', batas: () => BREAKS.kepadatan, w: ['#fee0d2', '#fc9272', '#de2d26'], fmt: nf0, ket: 'Kelas Jenks' },
  penduduk: { judul: 'Jumlah penduduk (jiwa)', field: 'Total', batas: d => tertil(d.features.map(f => f.properties.Total)), w: ['#efedf5', '#bcbddc', '#756bb1'], fmt: nf0, ket: 'Tertil (sepertiga data)' },
};
let tema = 'jarak', lvl = 'kel', pilih = null;
function kelasTema(data) {
  const t = DEF[tema], b = t.batas(data), v = data.features.map(f => f.properties[t.field] ?? 0);
  const lo = [Math.min(...v), ...b], hi = [...b, Math.max(...v)];
  return { b, kelas: t.w.map((w, i) => ({ w, label: `${t.fmt.format(lo[i])} – ${t.fmt.format(hi[i])}` })) };
}
function warna(p, b) { const t = DEF[tema], x = p[t.field] ?? 0; return t.w[x <= b[0] ? 0 : x <= b[1] ? 1 : 2]; }

// ---------- peta ----------
const map = L.map('map', { zoomSnap: 0.25, minZoom: 10, maxZoom: 17, maxBounds: L.latLngBounds(BOUNDS.basemap).pad(0.15) });
const bukaRTH = initRthPanel(map, KEL);
map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
const basemap = L.imageOverlay(PATHS.basemap, BOUNDS.basemap, { attribution: '© OpenStreetMap contributors', opacity: 0.9 }).addTo(map);
const lstImg = L.imageOverlay(PATHS.lst, BOUNDS.lst, { opacity: 0.85, attribution: 'LST: USGS Landsat 8 C2 L2' });
const jarImg = L.imageOverlay(PATHS.distance, ST.jarak_bounds, { opacity: 0.85 });
map.createPane('rth'); map.getPane('rth').style.zIndex = 450;
map.createPane('ico'); map.getPane('ico').style.zIndex = 650;

const rthPoly = L.geoJSON(RTH, { pane: 'rth', style: { color: '#0b4d1f', weight: 1.2, fillColor: '#2e9e4f', fillOpacity: 0.75 },
  onEachFeature: (f, l) => l.on('click', () => bukaRTH(f)) });
const rthIco = createRthIcons(RTH, bukaRTH).addTo(map);

function tooltipWilayah(p) {
  const nama = lvl === 'kel' ? `${toTitle(p.kel)} <span style="color:#666">(${toTitle(p.kec)})</span>` : `Kecamatan ${toTitle(p.kec)}`;
  return `<b>${nama}</b><br>Penduduk: ${nf0.format(p.Total)} jiwa<br>Kepadatan: ${nf0.format(p.kepadatan)} jiwa/km²<br>Jarak rata-rata ke RTH: ${nf0.format(p.jarak_m)} m<br>LST rata-rata: ${nf1.format(p.lst_mean)} °C`;
}
let kls = kelasTema(KEL);
function buatLayer(data) {
  return L.geoJSON(data, {
    style: f => ({ color: '#444', weight: lvl === 'kel' ? 0.6 : 1.2, fillColor: warna(f.properties, kls.b), fillOpacity: (lstImg._map || jarImg._map) ? 0.12 : 0.78 }),
    onEachFeature: (f, l) => {
      l.bindTooltip(() => tooltipWilayah(f.properties), { sticky: true });
      l.on({ mouseover: e => { if (e.target !== pilih) e.target.setStyle({ weight: 2.5, color: '#111' }); },
             mouseout: e => { if (e.target !== pilih) wil.resetStyle(e.target); },
             click: e => tandai(e.target) });
    }
  }).addTo(map);
}
let wil = buatLayer(KEL);
map.fitBounds(wil.getBounds(), { padding: [10, 10] });
L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

function gambarUlang() {
  const data = lvl === 'kel' ? KEL : KEC;
  kls = kelasTema(data);
  const nama = pilih ? (lvl === 'kel' ? null : null) : null;
  map.removeLayer(wil); pilih = null; wil = buatLayer(data);
  legenda(); isiTabelHL(null);
  document.getElementById('detail').innerHTML = '<p class="sub" style="margin:0">Klik sebuah wilayah di peta atau baris tabel.</p>';
}
function tandai(l) {
  if (pilih) wil.resetStyle(pilih);
  pilih = l; l.setStyle({ weight: 3.5, color: '#0f5c7a' }); l.bringToFront();
  isiDetail(l.feature.properties); isiTabelHL(l.feature.properties.kec); sorotTitik(lvl === 'kel' ? l.feature.properties : null);
}

function baris(a, b) { return `<tr><td>${a}</td><td>${b}</td></tr>`; }
function isiDetail(p) {
  const el = document.getElementById('detail');
  if (lvl === 'kec') {
    el.innerHTML = `<h3>Kecamatan ${toTitle(p.kec)}</h3><div class="kec">${p.jml_kel} kelurahan</div><table>
      ${baris('Penduduk', nf0.format(p.Total) + ' jiwa')}${baris('Luas', nf2.format(p.luas_km2) + ' km²')}
      ${baris('Kepadatan', nf0.format(p.kepadatan) + ' jiwa/km²')}${baris('Jarak rata-rata ke RTH', nf0.format(p.jarak_m) + ' m')}
      ${baris('LST rata-rata', nf2.format(p.lst_mean) + ' °C')}${baris('Kelurahan jauh &amp; panas', p.terpapar_kel + ' (' + nf0.format(p.terpapar_pend) + ' jiwa)')}</table>`;
    return;
  }
  el.innerHTML = `<h3>${toTitle(p.kel)}</h3>
    <div class="kec">Kecamatan ${toTitle(p.kec)} · jarak <span class="pill">${p.kelas_jarak}</span> · LST <span class="pill">${p.kelas_lst}</span>${p.terpapar ? ' · <span class="pill" style="background:#d7191c;color:#fff;border-color:#d7191c">jauh &amp; panas</span>' : ''}</div>
    <table>
      ${baris('Penduduk', nf0.format(p.Total) + ' jiwa')}
      ${baris('Luas', nf2.format(p.luas_km2) + ' km²')}
      ${baris('Kepadatan', nf0.format(p.kepadatan) + ' jiwa/km²')}
      ${baris('Jarak rata-rata ke RTH', nf0.format(p.jarak_m) + ' m')}
      ${baris('Luas ≤ 300 m dari RTH', nf1.format(p.dekat300_pc) + '%')}
      ${baris('RTH terdekat', `🌳 ${p.rth_terdekat || '-'}<br><span style="color:var(--muted)">${p.rth_tingkat || ''}, ${p.jarak_tepi_m ? nf0.format(p.jarak_tepi_m) + ' m dari batas' : 'berada di dalam kelurahan'}</span>`)}
      ${baris('LST rata-rata', nf1.format(p.lst_mean) + ' °C')}
      ${baris('NDVI rata-rata', nf2.format(p.ndvi))}
      ${baris('Lahan terbangun', nf1.format(p.terbangun_pc) + '%')}
    </table>`;
}

function legenda() {
  const t = DEF[tema];
  let h = `<div style="font-weight:600">${t.judul}</div><div class="sub" style="margin:0 0 4px">${t.ket}, level ${lvl === 'kel' ? 'kelurahan' : 'kecamatan'}</div>` +
    kls.kelas.slice().reverse().map(k => `<div class="legend-row"><span class="sw" style="background:${k.w}"></span>${k.label}</div>`).join('');
  if (document.getElementById('o-jr').checked) h += `<div style="font-weight:600;margin:10px 0 4px">Raster jarak ke RTH (m)</div><div style="height:12px;border-radius:2px;background:linear-gradient(90deg,#1a9850,#a6d96a 17%,#fee08b 33%,#f46d43 67%,#a50026)"></div><div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--muted)"><span>0</span><span>500</span><span>1.000</span><span>≥ 1.500</span></div>`;
  if (document.getElementById('o-lst').checked) h += `<div style="font-weight:600;margin:10px 0 4px">Citra LST (°C)</div><div style="height:12px;border-radius:2px;background:linear-gradient(90deg,#313695,#74add1,#e0f3f8,#ffffbf,#fdae61,#d73027,#a50026)"></div><div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--muted)"><span>≤ 30,2</span><span>35,8</span><span>≥ 41,5</span></div>`;
  if (document.getElementById('o-ico').checked) h += `<div class="legend-row" style="margin-top:8px"><span style="width:22px;text-align:center">🌳</span>RTH publik (ukuran ikon = tingkat layanan)</div>`;
  document.getElementById('legend').innerHTML = h;
}

// ---------- ringkasan ----------
const bIn = ST.bins[0].lst, b100 = ST.bins[1].lst, b250 = ST.bins[2].lst;
document.getElementById('tiles').innerHTML = [
  [nf1.format(b100 - bIn) + ' °C', 'lebih sejuk di dalam RTH dibanding area 0–100 m di sekitarnya'],
  ['± 250 m', 'jangkauan efek sejuk RTH; di luar itu LST tidak naik lagi'],
  ['ρ = ' + nfr.format(ST.spearman_kepadatan_lst_kel), 'kepadatan penduduk vs LST per kelurahan (kuat)'],
  ['ρ = ' + nfr.format(ST.spearman_jarak_lst_kel), 'jarak ke RTH vs LST per kelurahan (lemah)'],
].map(([b, s]) => `<div class="tile"><b>${b}</b><span>${s}</span></div>`).join('');
document.getElementById('temuan').innerHTML = `RTH menurunkan suhu permukaan di sekitarnya, tetapi hanya sampai ±250 m. Di kawasan terbangun, LST ±39 °C hampir sama pada semua jarak (ρ = ${nfr.format(ST.spearman_jarak_lst_piksel_terbangun)}). Suhu kelurahan lebih erat kaitannya dengan kerapatan vegetasi (ρ NDVI–LST = ${nfr.format(ST.spearman_ndvi_lst_kel)}) dan kepadatan penduduk. Hanya ${ST.terpapar.kel} kelurahan (${nf0.format(ST.terpapar.pend)} jiwa) yang tergolong jauh dari RTH sekaligus panas.`;

// ---------- grafik batang ----------
(function bar() {
  const svg = document.getElementById('bar'), W = 400, H = 230, m = { l: 34, r: 6, t: 14, b: 44 };
  const cats = ST.bins.map(b => b.kelas), a = ST.bins.map(b => b.lst), tb = [null, ...ST.bins_terbangun.map(b => b.lst)];
  const ymin = 34, ymax = 40, y = v => m.t + (H - m.t - m.b) * (1 - (v - ymin) / (ymax - ymin));
  const cw = (W - m.l - m.r) / cats.length, bw = (cw - 10) / 2;
  let g = '';
  for (let v = ymin; v <= ymax; v += 1) g += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  g += `<text x="${m.l - 28}" y="${m.t - 4}">°C</text>`;
  cats.forEach((c, i) => {
    const x0 = m.l + i * cw + 4;
    [[a[i], 'var(--s1)', 'Semua lahan', ST.bins[i].piksel], [tb[i], 'var(--s2)', 'Lahan terbangun', i ? ST.bins_terbangun[i - 1].piksel : 0]].forEach(([v, col, nm, px], j) => {
      if (v == null) return;
      const x = x0 + j * (bw + 2), yy = y(v), h = y(ymin) - yy;
      g += `<path d="M${x},${y(ymin)} V${yy + 3} q0,-3 3,-3 h${bw - 6} q3,0 3,3 V${y(ymin)} Z" fill="${col}" data-t="${c}<br>${nm}: <b>${nf2.format(v)} °C</b><br>${nf0.format(px)} piksel"/>`;
      g += `<rect x="${x - 1}" y="${m.t}" width="${bw + 2}" height="${y(ymin) - m.t}" fill="transparent" data-t="${c}<br>${nm}: <b>${nf2.format(v)} °C</b><br>${nf0.format(px)} piksel"/>`;
    });
    if (i === 0 || i === 2) g += `<text class="val" x="${x0 + bw / 2}" y="${y(a[i]) - 5}" text-anchor="middle">${nf1.format(a[i])}</text>`;
    const lines = c.replace('Di dalam RTH', 'Di dalam|RTH').split('|');
    lines.forEach((t, k) => g += `<text x="${x0 + cw / 2 - 4}" y="${H - m.b + 16 + k * 12}" text-anchor="middle">${t}</text>`);
  });
  g += `<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${y(ymin)}" y2="${y(ymin)}"/>`;
  g += `<text x="${m.l}" y="${H - 4}">Sumbu tegak dimulai dari 34 °C.</text>`;
  svg.innerHTML = g;
  svg.querySelectorAll('[data-t]').forEach(el => { el.addEventListener('mousemove', e => showTip(e, el.dataset.t)); el.addEventListener('mouseleave', hideTip); });
})();

// ---------- diagram pencar ----------
let sorotTitik = () => {};
(function sc() {
  const svg = document.getElementById('sc'), W = 400, H = 260, m = { l: 34, r: 8, t: 10, b: 36 };
  const P = KEL.features.map(f => f.properties);
  const xmax = 4000, ymin = 33, ymax = 41;
  const x = v => m.l + (W - m.l - m.r) * v / xmax, y = v => m.t + (H - m.t - m.b) * (1 - (v - ymin) / (ymax - ymin));
  const rmax = Math.max(...P.map(p => p.kepadatan)), r = v => 2.5 + 6.5 * Math.sqrt(v / rmax);
  let g = '';
  for (let v = ymin; v <= ymax; v += 2) g += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  for (let v = 0; v <= xmax; v += 1000) g += `<text x="${x(v)}" y="${H - m.b + 15}" text-anchor="middle">${nf0.format(v)}</text>`;
  g += `<text x="${W - m.r}" y="${H - 4}" text-anchor="end">Jarak rata-rata ke RTH (m)</text><text x="${m.l - 28}" y="${m.t - 0}">°C</text>`;
  g += `<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${y(ymin)}" y2="${y(ymin)}"/>`;
  const s = ST.regresi.slope_per_100m / 100, c = ST.regresi.intercept;
  g += `<line x1="${x(0)}" y1="${y(c)}" x2="${x(xmax)}" y2="${y(c + s * xmax)}" stroke="var(--muted)" stroke-dasharray="4 3" stroke-width="1.5"/>`;
  P.slice().sort((a, b) => b.kepadatan - a.kepadatan).forEach(p => {
    g += `<circle cx="${x(p.jarak_m)}" cy="${y(p.lst_mean)}" r="${r(p.kepadatan)}" fill="var(--s1)" fill-opacity="0.55" stroke="var(--panel)" stroke-width="1" data-k="${p.kel}" data-t="<b>${toTitle(p.kel)}</b> (${toTitle(p.kec)})<br>Jarak: ${nf0.format(p.jarak_m)} m<br>LST: ${nf1.format(p.lst_mean)} °C<br>Kepadatan: ${nf0.format(p.kepadatan)} jiwa/km²"/>`;
  });
  g += `<circle id="sc-hl" r="0" fill="none" stroke="var(--ink)" stroke-width="2"/>`;
  svg.innerHTML = g;
  svg.querySelectorAll('[data-t]').forEach(el => {
    el.addEventListener('mousemove', e => showTip(e, el.dataset.t)); el.addEventListener('mouseleave', hideTip);
    el.addEventListener('click', () => { if (lvl !== 'kel') { document.getElementById('l-kel').click(); } wil.eachLayer(l => { if (l.feature.properties.kel === el.dataset.k) { map.fitBounds(l.getBounds(), { maxZoom: 15 }); tandai(l); } }); });
  });
  sorotTitik = p => { const hl = document.getElementById('sc-hl'); if (!p) { hl.setAttribute('r', 0); return; } hl.setAttribute('cx', x(p.jarak_m)); hl.setAttribute('cy', y(p.lst_mean)); hl.setAttribute('r', r(p.kepadatan) + 3); };
  document.getElementById('sc-note').textContent = `Ukuran titik = kepadatan penduduk. Garis putus-putus = tren linear (${nfr.format(ST.regresi.slope_per_100m)} °C per 100 m). ρ Spearman = ${nfr.format(ST.spearman_jarak_lst_kel)} (kelurahan), ${nfr.format(ST.spearman_jarak_lst_kec)} (kecamatan).`;
})();

// ---------- tabel kecamatan ----------
const KOL = [['kec', 'Kecamatan'], ['Total', 'Penduduk'], ['kepadatan', 'Jiwa/km²'], ['jarak_m', 'Jarak (m)'], ['lst_mean', 'LST (°C)'], ['terpapar_pend', 'Jauh & panas (jiwa)']];
let urut = ['lst_mean', -1];
function isiTabel() {
  const rows = KEC.features.map(f => f.properties).sort((a, b) => { const [k, d] = urut; return (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * d; });
  document.querySelector('#tkec thead').innerHTML = '<tr>' + KOL.map(([k, l]) => `<th data-k="${k}" tabindex="0">${l}${urut[0] === k ? (urut[1] > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('') + '</tr>';
  document.querySelector('#tkec tbody').innerHTML = rows.map(p => `<tr data-kec="${p.kec}"><td>${toTitle(p.kec)}</td><td>${nf0.format(p.Total)}</td><td>${nf0.format(p.kepadatan)}</td><td>${nf0.format(p.jarak_m)}</td><td>${nf1.format(p.lst_mean)}</td><td>${p.terpapar_pend ? nf0.format(p.terpapar_pend) : '–'}</td></tr>`).join('');
  document.querySelectorAll('#tkec th').forEach(th => { const go = () => { urut = [th.dataset.k, urut[0] === th.dataset.k ? -urut[1] : -1]; isiTabel(); }; th.onclick = go; th.onkeydown = e => { if (e.key === 'Enter') go(); }; });
  document.querySelectorAll('#tkec tbody tr').forEach(tr => tr.onclick = () => {
    if (lvl !== 'kec') document.getElementById('l-kec').click();
    wil.eachLayer(l => { if (l.feature.properties.kec === tr.dataset.kec) { map.fitBounds(l.getBounds(), { maxZoom: 14 }); tandai(l); } });
  });
}
function isiTabelHL(kec) { document.querySelectorAll('#tkec tbody tr').forEach(tr => tr.classList.toggle('hl', tr.dataset.kec === kec)); }
isiTabel();



// ---------- kontrol ----------
document.querySelectorAll('input[name=tema]').forEach(r => r.addEventListener('change', e => { tema = e.target.value; gambarUlang(); }));
document.querySelectorAll('input[name=lvl]').forEach(r => r.addEventListener('change', e => { lvl = e.target.value; gambarUlang(); sorotTitik(null); }));
const tgl = (id, layer, restyle) => document.getElementById(id).addEventListener('change', e => { e.target.checked ? layer.addTo(map) : layer.remove(); if (restyle) wil.setStyle(f => ({ fillOpacity: (lstImg._map || jarImg._map) ? 0.12 : 0.78 })); legenda(); });
tgl('o-ico', rthIco); tgl('o-rth', rthPoly); tgl('o-jr', jarImg, true); tgl('o-lst', lstImg, true); tgl('o-bm', basemap);

const idx = {};
KEL.features.forEach(f => { idx[`${toTitle(f.properties.kel)} — ${toTitle(f.properties.kec)}`] = f.properties.kel; });
document.getElementById('daftar').innerHTML = Object.keys(idx).sort().map(k => `<option value="${k}"></option>`).join('');
document.getElementById('cari').addEventListener('submit', e => {
  e.preventDefault();
  const q = document.getElementById('q').value.trim().toLowerCase(), msg = document.getElementById('msg');
  const key = Object.keys(idx).find(k => k.toLowerCase() === q) || Object.keys(idx).find(k => k.toLowerCase().startsWith(q));
  if (!q || !key) { msg.textContent = 'Kelurahan tidak ditemukan. Periksa ejaan atau pilih dari daftar.'; return; }
  msg.textContent = '';
  if (lvl !== 'kel') document.getElementById('l-kel').click();
  wil.eachLayer(l => { if (l.feature.properties.kel === idx[key]) { map.fitBounds(l.getBounds(), { maxZoom: 15, padding: [30, 30] }); tandai(l); } });
});

legenda();
const awal = KEL.features.slice().sort((a, b) => b.properties.lst_mean - a.properties.lst_mean)[0].properties.kel;
wil.eachLayer(l => { if (l.feature.properties.kel === awal) tandai(l); });
