# Web-GIS Paparan Panas, Akses RTH, dan Kepadatan Penduduk Kota Surabaya

Web-GIS untuk UAS Sistem Informasi Spasial (Informatika, UPN "Veteran" Jawa Timur).
Dibangun dengan HTML, CSS, dan JavaScript (Leaflet 1.9.4), tanpa backend.

- **Versi 1 (`index.html`)**: prioritas kebutuhan RTH per kelurahan (skor kepadatan, LST, dan akses RTH).
- **Versi 2 (`v2.html`)**: hubungan jarak ke RTH, suhu permukaan (LST), dan penduduk, pada level kelurahan dan kecamatan.

## Struktur folder

```
├── index.html                      Versi 1: prioritas kebutuhan RTH
├── analysis.html                   Versi 2: jarak ke RTH, LST, dan penduduk
├── assets/
│   ├── css/
│   │   ├── base.css                token warna, tema, aturan bersama
│   │   ├── components/rth-panel.css
│   │   └── pages/                  priority.css, analysis.css
│   └── js/
│       ├── config.js               path data, batas kelas, warna
│       ├── utils/                  format.js (angka), data.js (fetch)
│       ├── components/             rth-panel.js, rth-icons.js
│       └── pages/                  priority.js, analysis.js (entry point)
└── data/
    ├── vector/                     GeoJSON kelurahan, kecamatan, RTH
    ├── raster/                     basemap, LST, jarak ke RTH (+ raster-bounds.json)
    └── stats/                      analysis-stats.json
```

## Menjalankan di lokal

Halaman memuat data dengan `fetch()`, jadi **harus dibuka lewat server lokal**, bukan double-click.

- **VS Code / Antigravity**: pasang ekstensi *Live Server* (atau *Five Server*), klik kanan `index.html` lalu pilih *Open with Live Server*.
- **Terminal**: jalankan `python -m http.server 8000` di folder ini, lalu buka `http://localhost:8000`.

## Publikasi ke GitHub Pages

1. Unggah isi folder ini ke akar (root) sebuah repo publik.
2. Buka *Settings → Pages → Deploy from a branch*, pilih `main` dan `/ (root)`.
3. Halaman tersedia di `https://USERNAME.github.io/NAMA-REPO/`.

## Sumber data

Batas kelurahan: Badan Informasi Geospasial. Jumlah penduduk: Satu Data Kota Surabaya (diakses 16 Nov 2026).
RTH publik dan peta dasar: © OpenStreetMap contributors. LST dan NDVI: USGS Landsat 8 Collection 2 Level-2 (30 Juni 2026).
Radius layanan RTH: Permen ATR/BPN No. 14 Tahun 2022.

Dibuat oleh I Kadek Rangga Sandi Kusuma Wardana, 2026.
