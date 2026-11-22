// format.js — format angka dan teks gaya Indonesia (titik ribuan, koma desimal).

export const nf0 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
export const nf1 = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const nf2 = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const nfr = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' });

// "GENTING KALIANAK" -> "Genting Kalianak"
export const toTitle = s => (s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
