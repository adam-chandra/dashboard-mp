import type { FilterPayload, FilterState } from '../types';

/**
 * Hapus duplikat dan pilihan placeholder "Semua *" karena backend MP menerima
 * array kosong sebagai sinyal "tanpa filter". Replikasi `sanitizeMulti` dari Vue.
 */
export function sanitizeMulti(arr: string[] | undefined): string[] {
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of arr) {
    const v = (raw ?? '').toString().trim();
    if (!v) continue;
    if (/^semua\b/i.test(v)) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

export function buildPayload(filter: FilterState, extra?: Partial<FilterPayload>): FilterPayload {
  return {
    tanggal_mulai: filter.tanggal_mulai,
    tanggal_selesai: filter.tanggal_selesai,
    channel: sanitizeMulti(filter.channel),
    kanal: sanitizeMulti(filter.kanal),
    nama_toko: sanitizeMulti(filter.nama_toko),
    kategori: sanitizeMulti(filter.kategori),
    product_name: sanitizeMulti(filter.product_name),
    brand: sanitizeMulti(filter.brand),
    team: sanitizeMulti(filter.team),
    ...extra,
  };
}

export function payloadKey(payload: FilterPayload): string {
  return JSON.stringify(payload);
}

export function filtersEqual(a: FilterState, b: FilterState): boolean {
  if (a.tanggal_mulai !== b.tanggal_mulai) return false;
  if (a.tanggal_selesai !== b.tanggal_selesai) return false;
  const keys: (keyof FilterState)[] = [
    'channel',
    'kanal',
    'nama_toko',
    'kategori',
    'product_name',
    'brand',
    'team',
  ];
  for (const k of keys) {
    const av = sanitizeMulti(a[k] as string[]);
    const bv = sanitizeMulti(b[k] as string[]);
    if (av.length !== bv.length) return false;
    for (let i = 0; i < av.length; i++) if (av[i] !== bv[i]) return false;
  }
  return true;
}
