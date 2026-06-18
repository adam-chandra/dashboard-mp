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
  { key: 'gmv', title: 'GMV', unit: 'IDR', color: 'sky' },
  { key: 'qty', title: 'Quantity Pcs', unit: 'Pcs', color: 'amber' },
  { key: 'sku', title: 'Active SKU', unit: 'SKU', color: 'violet' },
  { key: 'pesanan', title: 'Total Order', unit: 'Invoices', color: 'emerald' },
] as const;

export const NPL_CODES = ['BKL-R01', 'CKM-R01', 'ETH-R01', 'GTF-R01', 'LIN-S04', 'ETF-R01'] as const;

export const ITEMS_PER_PAGE = 30;
export const SEARCH_DEBOUNCE_MS = 500;
export const FILTER_DEBOUNCE_MS = 300;
