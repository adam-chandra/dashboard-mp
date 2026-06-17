import { useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api';
import type {
  GrafikItem,
  LogistikItem,
  MetrikResponse,
  OptionsState,
  PeringkatItem,
  RingkasanResponse,
  SalesPerformanceResponse,
} from '../types';
import { DEFAULT_METRIK } from '../constants';
import { useDashboardStore } from '../store/dashboard';
import { buildPayload, payloadKey } from '../lib/filters';

/**
 * Bangun payload yang sesuai filter aktif & filterKey saat ini.
 * filterKey ikut dimasukkan ke queryKey supaya tombol REFRESH (apply ulang
 * tanpa perubahan) tetap memicu refetch.
 */
function useActivePayload() {
  const filter = useDashboardStore((s) => s.filter);
  const filterKey = useDashboardStore((s) => s.filterKey);
  const filterApplied = useDashboardStore((s) => s.filterApplied);
  const payload = buildPayload(filter);
  return { payload, key: payloadKey(payload), filterKey, filterApplied };
}

export function useMetrikQuery() {
  const { payload, key, filterKey } = useActivePayload();
  return useQuery<MetrikResponse>({
    queryKey: ['metrik', key, filterKey],
    queryFn: async ({ signal }) => {
      const res = await api.post('/api/metrik', payload, { signal });
      return (res.data as MetrikResponse) ?? DEFAULT_METRIK;
    },
    placeholderData: keepPreviousData,
  });
}

export function useGrafikQuery() {
  const { payload, key, filterKey } = useActivePayload();
  return useQuery<GrafikItem[]>({
    queryKey: ['grafik', key, filterKey],
    queryFn: async ({ signal }) => {
      const res = await api.post('/api/grafik', payload, { signal });
      return Array.isArray(res.data) ? (res.data as GrafikItem[]) : [];
    },
    placeholderData: keepPreviousData,
  });
}

export function usePeringkatQuery() {
  const { payload, key, filterKey } = useActivePayload();
  return useQuery<PeringkatItem[]>({
    queryKey: ['peringkat', key, filterKey],
    queryFn: async ({ signal }) => {
      const res = await api.post('/api/peringkat', payload, { signal });
      return Array.isArray(res.data) ? (res.data as PeringkatItem[]) : [];
    },
    placeholderData: keepPreviousData,
  });
}

export function useSalesPerformanceQuery(enabled = true) {
  const { payload, key, filterKey } = useActivePayload();
  return useQuery<SalesPerformanceResponse>({
    queryKey: ['sales-performance', key, filterKey],
    queryFn: async ({ signal }) => {
      const res = await api.post('/api/sales-performance', payload, { signal });
      return res.data as SalesPerformanceResponse;
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 3 * 60_000,
  });
}

export function useLogistikQuery(search: string, enabled = true) {
  const { payload, key, filterKey } = useActivePayload();
  const trimmed = search.trim();
  const composed = trimmed ? { ...payload, search: trimmed } : payload;
  return useQuery<LogistikItem[]>({
    queryKey: ['logistik', key, filterKey, trimmed],
    queryFn: async ({ signal }) => {
      const res = await api.post('/api/logistik', composed, { signal });
      return Array.isArray(res.data) ? (res.data as LogistikItem[]) : [];
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useRingkasanQuery(enabled: boolean) {
  const { payload, key, filterKey } = useActivePayload();
  return useQuery<RingkasanResponse>({
    queryKey: ['ringkasan', key, filterKey],
    queryFn: async ({ signal }) => {
      const res = await api.post('/api/ringkasan', payload, { signal });
      return res.data as RingkasanResponse;
    },
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Hook untuk mem-load dropdown options. Tergantung pada channel/kanal/nama_toko
 * dari tempFilter agar cascading dropdown bisa berfungsi.
 */
export function useOptionsQuery() {
  const tempFilter = useDashboardStore((s) => s.tempFilter);
  const setOptions = useDashboardStore((s) => s.setOptions);
  const payload = buildPayload(tempFilter);
  const cascadeKey = JSON.stringify({
    channel: payload.channel,
    kanal: payload.kanal,
    nama_toko: payload.nama_toko,
  });

  const query = useQuery<OptionsState>({
    queryKey: ['options', cascadeKey],
    queryFn: async ({ signal }) => {
      const res = await api.post('/api/options', payload, { signal });
      const d = res.data ?? {};
      return {
        channel: Array.isArray(d.channel) ? d.channel : [],
        kanal: Array.isArray(d.kanal) ? d.kanal : [],
        nama_toko: Array.isArray(d.nama_toko) ? d.nama_toko : [],
        kategori: Array.isArray(d.kategori) ? d.kategori : [],
        product_name: Array.isArray(d.product_name) ? d.product_name : [],
        brand: Array.isArray(d.brand) ? d.brand : [],
        team: Array.isArray(d.team) ? d.team : [],
      };
    },
    staleTime: 5 * 60_000,
  });

  // Sinkronisasi hasil ke store agar bisa diakses semua komponen.
  useEffect(() => {
    if (query.data) setOptions(query.data);
  }, [query.data, setOptions]);

  return query;
}
