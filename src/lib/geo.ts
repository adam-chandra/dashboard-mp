export const GEOJSON_URLS = {
  provinsi: '/geo/provinsi_simplified.geojson',
  kabkota: '/geo/kabkota_simplified.geojson',
} as const;

export const CHOROPLETH = [
  '#dbeafe', '#bae6fd', '#7dd3fc', '#38bdf8',
  '#0ea5e9', '#6366f1', '#4f46e5', '#312e81',
];
export const MAP_EMPTY_AREA = '#f1f5f9';

const DIRTY_REGION = new Set(['', '-', '--', 'UNKNOWN', 'NULL', 'NONE', 'N/A', 'LAINNYA']);
export function isCleanRegion(name: string | undefined | null): boolean {
  if (name == null) return false;
  const u = String(name).trim().toUpperCase();
  return !DIRTY_REGION.has(u);
}

export function normKota(s: string | undefined | null): string {
  if (!s) return '';
  let u = String(s).toUpperCase().trim();
  u = u.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  u = u.replace(/^(KOTAMADYA|KOTAMDY|KABUPATEN|KOTA|KAB|DAERAH)(?:\.\s*|\s+)/i, '');
  u = u.replace(/\s+(KOTAMADYA|KOTAMDY|KABUPATEN|KOTA|KAB)\.?$/i, '');
  u = u.replace(/(^|\s)ADM\.?\s+/g, ' ').replace(/\s+ADM\.?(\s|$)/g, ' ');
  u = u.replace(/\s+/g, ' ').trim();
  if (u === 'PALANGKARAYA') return 'PALANGKA RAYA';
  if (u === 'PARE PARE') return 'PAREPARE';
  if (u === 'SOLO') return 'SURAKARTA';
  if (u === 'BANGKABELITUNG') return 'BANGKA BELITUNG';
  if (u === 'TANJUNG PINANG') return 'TANJUNGPINANG';
  if (u === 'TANJUNGPINANG') return 'TANJUNGPINANG';
  if (u === 'JAKARTA') return 'JAKARTA PUSAT';
  if (u === 'BATU BARA') return 'BATUBARA';
  return u;
}

export function normProvinsi(s: string | undefined | null): string {
  if (!s) return '';
  let u = String(s).toUpperCase().trim();
  u = u.replace(/^PROVINSI\s+/i, '').replace(/^PROV\.?\s+/i, '');
  u = u.replace(/\s+/g, ' ').trim();
  if (!u) return '';
  if (u.includes('JAKARTA')) return 'DKI JAKARTA';
  if (u.includes('YOGYA') || u === 'DIY') return 'DI YOGYAKARTA';
  if (u.includes('ACEH')) return 'ACEH';
  if (u.includes('BANGKA')) return 'BANGKA-BELITUNG';
  if (u === 'KEPRI' || u.includes('KEPULAUAN RIAU') || /^KEP\.?\s+RIAU$/.test(u))
    return 'KEPULAUAN RIAU';
  if (u === 'NTB') return 'NUSA TENGGARA BARAT';
  if (u === 'NTT') return 'NUSA TENGGARA TIMUR';
  if (u === 'IRIAN JAYA') return 'PAPUA';
  if (u === 'IRIAN JAYA BARAT') return 'PAPUA BARAT';
  return u;
}

interface GeoFeatureProps {
  name?: string;
  Propinsi?: string;
  PROVINSI?: string;
  provinsi?: string;
  NAME_1?: string;
  NAME?: string;
  alt_name?: string;
}
export function extractGeoName(props: GeoFeatureProps | undefined | null): string {
  if (!props) return '';
  return (
    props.name ||
    props.Propinsi ||
    props.PROVINSI ||
    props.provinsi ||
    props.NAME_1 ||
    props.NAME ||
    props.alt_name ||
    ''
  );
}

export interface GeoJsonFeature {
  type: 'Feature';
  properties: GeoFeatureProps;
  geometry: unknown;
}
export interface GeoJson {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export async function fetchGeoJSON(url: string): Promise<GeoJson> {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as GeoJson;
}
