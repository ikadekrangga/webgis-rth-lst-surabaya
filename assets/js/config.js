// config.js — semua path data dan konstanta yang dipakai lebih dari satu halaman.
// Ubah di sini kalau nama file data atau batas kelas berubah.

export const PATHS = {
  kelurahanPriority: 'data/vector/kelurahan-priority.geojson',
  kelurahanAnalysis: 'data/vector/kelurahan-analysis.geojson',
  kecamatanAnalysis: 'data/vector/kecamatan-analysis.geojson',
  rth: 'data/vector/rth-public.geojson',
  analysisStats: 'data/stats/analysis-stats.json',
  rasterBounds: 'data/raster/raster-bounds.json',
  basemap: 'data/raster/basemap-osm.jpg',
  lst: 'data/raster/lst-2026-06-30.png',
  distance: 'data/raster/distance-to-rth.png',
};

// Batas kelas Jenks (3 kelas) hasil olahan QGIS; sama dengan peta cetak.
export const BREAKS = {
  kepadatan: [12025.0159, 27083.4091], // jiwa/km²
  lst: [36.4818, 38.4001],             // °C
  akses: [18.1864, 55.4154],           // % luas terjangkau RTH 700 m
};

export const COLORS = {
  prioritas: { Rendah: '#1a9641', Sedang: '#fdae61', Tinggi: '#d7191c' },
  rthStroke: '#0b4d1f',
  rthFill: '#2e9e4f',
  highlight: '#0f5c7a',
};

// Ukuran ikon RTH (px) menurut tingkat layanan Permen ATR/BPN 14/2022.
export const RTH_ICON_SIZE = { Kota: 26, Kecamatan: 22, Kelurahan: 18, RW: 15, RT: 13 };

export const MAP_OPTIONS = { zoomSnap: 0.25, minZoom: 10, maxZoom: 17 };
