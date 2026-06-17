import type { FilterState, MetrikResponse } from './types';

export const DEFAULT_FILTER: FilterState = {
  tanggal_mulai: '',
  tanggal_selesai: '',
  channel: [],
  kanal: [],
  nama_toko: [],
  kategori: [],
  product_name: [],
  brand: [],
  team: [],
};

export const DEFAULT_METRIK: MetrikResponse = {
  gmv: { sekarang: 0, lalu: 0 },
  qty: { sekarang: 0, lalu: 0 },
  sku: { sekarang: 0, lalu: 0 },
  pesanan: { sekarang: 0, lalu: 0 },
};

export const KPI_LIST = [
  { key: 'gmv', title: 'Omset', unit: 'IDR', color: 'sky' },
  { key: 'qty', title: 'Jumlah Produk', unit: 'Pcs', color: 'amber' },
  { key: 'sku', title: 'SKU Aktif', unit: 'SKU', color: 'violet' },
  { key: 'pesanan', title: 'Total Pesanan', unit: 'Order', color: 'emerald' },
] as const;

export const ITEMS_PER_PAGE = 30;
export const SEARCH_DEBOUNCE_MS = 500;
export const FILTER_DEBOUNCE_MS = 300;
