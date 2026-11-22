// data.js — memuat file JSON/GeoJSON dan menampilkan pesan bila gagal.

export async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal memuat ${url} (status ${res.status})`);
  return res.json();
}

// Memuat beberapa file sekaligus. Bila gagal (misalnya halaman dibuka lewat file://),
// pesan petunjuk ditampilkan di elemen peta lalu error dilempar ulang.
export async function loadAll(urls, mapElementId = 'map') {
  try {
    return await Promise.all(urls.map(loadJSON));
  } catch (err) {
    document.getElementById(mapElementId).innerHTML = `
      <div style="padding:24px;font-family:sans-serif;max-width:520px">
        <b>Data peta tidak bisa dimuat.</b><br>${err.message}<br><br>
        Buka halaman ini lewat server lokal (Live Server di VS Code, atau
        <code>python -m http.server</code>), bukan dengan double-click.
      </div>`;
    throw err;
  }
}
