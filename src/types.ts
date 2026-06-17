export interface User {
  email: string;
  role: string;
  allowed_kanal: string;
}

export interface FilterState {
  tanggal_mulai: string;
  tanggal_selesai: string;
  channel: string[];
  kanal: string[];
  nama_toko: string[];
  kategori: string[];
  product_name: string[];
  brand: string[];
  team: string[];
}

export type FilterPayload = FilterState & { search?: string };

export interface OptionsState {
  channel: string[];
  kanal: string[];
  nama_toko: string[];
  kategori: string[];
  product_name: string[];
  brand: string[];
  team: string[];
}

export interface MetrikItem {
  sekarang: number;
  lalu: number;
}

export interface MetrikResponse {
  gmv: MetrikItem;
  qty: MetrikItem;
  sku: MetrikItem;
  pesanan: MetrikItem;
}

export interface GrafikItem {
  sumbu_x?: string;
  sumbu_x_lalu?: string;
  periode_sekarang?: number;
  periode_sebelumnya?: number;
  qty_sekarang?: number;
  qty_sebelumnya?: number;
}

export interface PeringkatItem {
  nama_toko: string;
  gmv_total: number;
  growth: number;
}

export interface LogistikItem {
  tanggal: string;
  order_number: string;
  nama_toko: string;
  kanal: string;
  status_wms: string;
  status_3pl: string;
  status_fix: string;
  omzet: number;
  std_return: string;
}

export interface ContribItem {
  label: string;
  omset: number;
  qty: number;
}

export interface GeoItem {
  wilayah: string;
  omset: number;
}

export interface HeroProduct {
  product_name: string;
  brand: string;
  kategori: string;
  gmv: number;
  share: number;
}

export interface NPLSeries {
  kode: string;
  product_name: string;
  day_30: number;
  day_60: number;
  day_90: number;
  qty_d30: number;
  qty_d60: number;
  qty_d90: number;
  sampel: number;
  found: boolean;
  auto_discovered?: boolean;
}

export interface LeaderboardItem {
  peringkat: number;
  product_name: string;
  brand: string;
  gmv: number;
  gmv_lalu: number;
  growth: number;
  aov: number;
  asp: number;
}

export interface SalesPerformanceResponse {
  periode_sekarang_mulai: string;
  periode_sekarang_selesai: string;
  periode_lalu_mulai: string;
  periode_lalu_selesai: string;
  total_omset: number;
  contrib_by_brand: ContribItem[];
  contrib_by_kanal: ContribItem[];
  contrib_by_kategori: ContribItem[];
  top_provinsi: GeoItem[];
  top_kota: GeoItem[];
  provinsi_mapping_stats: { mapped_count: number; unmapped_count: number };
  hero_products: HeroProduct[];
  npl_series: NPLSeries[];
  leaderboard: LeaderboardItem[];
}

export interface KanalBreakdown {
  kanal: string;
  omset_sekarang: number;
  omset_lalu: number;
}

export interface TokoBreakdown {
  toko: string;
  kanal: string;
  omset_sekarang: number;
  omset_lalu: number;
  growth?: number;
}

export interface RingkasanResponse {
  periode_sekarang_mulai: string;
  periode_sekarang_selesai: string;
  periode_lalu_mulai: string;
  periode_lalu_selesai: string;
  total_omset: number;
  total_omset_lalu: number;
  total_qty: number;
  total_qty_lalu: number;
  per_kanal: KanalBreakdown[];
  toko_top_growth: TokoBreakdown | null;
  toko_bottom_growth: TokoBreakdown | null;
}
