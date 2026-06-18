import { create } from 'zustand';
import axios, { AxiosError, CanceledError } from 'axios';
import { api } from '../api';
import type {
  FilterState,
  GrafikItem,
  LogistikItem,
  MetrikResponse,
  OptionsState,
  PeringkatItem,
  RingkasanResponse,
  SalesPerformanceResponse,
  SummaryDrawerData,
  User,
} from '../types';
import { DEFAULT_FILTER, DEFAULT_METRIK } from '../constants';
import { formatDateISO, getMonthRange, formatRangeLabel } from '../lib/date';
import { sanitizeMulti } from '../lib/filters';

const STORAGE_KEY = 'ethos_user';

function readUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (!parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isCanceled(err: unknown): boolean {
  if (err instanceof CanceledError) return true;
  if (axios.isCancel?.(err)) return true;
  const e = err as { name?: string; code?: string };
  return e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED';
}

function buildDefaultFilter(): FilterState {
  const range = getMonthRange();
  return {
    ...DEFAULT_FILTER,
    tanggal_mulai: range.tanggal_mulai,
    tanggal_selesai: range.tanggal_selesai,
  };
}

function safePayload(f: FilterState): FilterState {
  return {
    tanggal_mulai: f.tanggal_mulai ?? '',
    tanggal_selesai: f.tanggal_selesai ?? '',
    channel: sanitizeMulti(f.channel),
    kanal: sanitizeMulti(f.kanal),
    nama_toko: sanitizeMulti(f.nama_toko),
    kategori: sanitizeMulti(f.kategori),
    product_name: sanitizeMulti(f.product_name),
    brand: sanitizeMulti(f.brand),
    team: sanitizeMulti(f.team),
  };
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function filtersEqual(a: FilterState, b: FilterState): boolean {
  return JSON.stringify(safePayload(a)) === JSON.stringify(safePayload(b));
}

export type TrendMode = '' | 'monthly' | 'quarterly' | 'yearly';

function buildTrendOverridePayload(filter: FilterState, mode: TrendMode): FilterState {
  const anchor = filter.tanggal_mulai ? new Date(filter.tanggal_mulai) : new Date();
  const year = anchor.getFullYear();
  const start = mode === 'yearly' ? '2000-01-01' : `${year}-01-01`;
  const end = mode === 'yearly' ? formatDateISO(new Date()) : `${year}-12-31`;
  return { ...safePayload(filter), tanggal_mulai: start, tanggal_selesai: end };
}

interface DashboardState {
  currentUser: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;

  filter: FilterState;
  tempFilter: FilterState;
  defaultFilter: FilterState | null;
  filterApplied: boolean;
  filterDirty: boolean;
  filterBusy: boolean;
  filterKey: number;
  prevDateText: string;
  progress: number;
  setTempFilter: (next: FilterState) => void;

  options: OptionsState;

  metrik: MetrikResponse;
  peringkat: PeringkatItem[];
  logistik: LogistikItem[];
  grafikDataRaw: GrafikItem[];
  trendOverride: GrafikItem[];
  trendOverrideMode: TrendMode;
  salesPerformance: SalesPerformanceResponse | null;
  salesPerfError: string;
  dashboardReady: boolean;

  summaryOpen: boolean;
  summaryLoading: boolean;
  summaryError: string;
  summaryData: SummaryDrawerData | null;
  toggleSummary: (next?: boolean) => void;

  sidebarPinned: boolean;
  setSidebarPinned: (v: boolean) => void;

  initDashboard: () => Promise<void>;
  loadDropdownOptions: (signal?: AbortSignal) => Promise<void>;
  applyFilter: (tempFilter?: FilterState) => Promise<void>;
  resetFilter: () => Promise<void>;
  searchLogistik: (query: string) => Promise<void>;
  openSummary: () => Promise<void>;
  setTrendOverrideMode: (mode: TrendMode | string) => Promise<void>;
}

let masterCtrl: AbortController | null = null;
let trendCtrl: AbortController | null = null;
let logistikSearchCtrl: AbortController | null = null;
let progressTimer: ReturnType<typeof setInterval> | null = null;
let activeApplyToken = 0;

function startProgress(
  set: (s: Partial<DashboardState>) => void,
  get: () => DashboardState
) {
  if (progressTimer) clearInterval(progressTimer);
  set({ progress: 5 });
  progressTimer = setInterval(() => {
    const p = get().progress;
    if (p < 90) {
      const step = p < 40 ? 9 : p < 70 ? 5 : 2;
      set({ progress: Math.min(90, p + step) });
    }
  }, 120);
}

function finishProgress(
  set: (s: Partial<DashboardState>) => void,
  get: () => DashboardState
) {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  set({ progress: 100 });
  setTimeout(() => {
    if (!get().filterBusy) set({ progress: 0 });
  }, 300);
}

function newRequestBatch(): AbortSignal {
  if (masterCtrl) {
    try {
      masterCtrl.abort();
    } catch {
      /* ignore */
    }
  }
  masterCtrl = new AbortController();
  return masterCtrl.signal;
}

function clearStaleData(set: (s: Partial<DashboardState>) => void) {
  set({
    salesPerformance: null,
    salesPerfError: '',
    peringkat: [],
    grafikDataRaw: [],
    logistik: [],
    trendOverride: [],
  });
}

function hitungRentangSebelumnya(start: string): {
  mulai: string;
  selesai: string;
  text: string;
} {
  if (!start) return { mulai: '', selesai: '', text: '' };
  const d = new Date(start);
  const prevStart = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const prevEnd = new Date(d.getFullYear(), d.getMonth(), 0);
  const a = formatDateISO(prevStart);
  const b = formatDateISO(prevEnd);
  return { mulai: a, selesai: b, text: `${a} to ${b}` };
}

async function runFetchBatch(
  signal: AbortSignal,
  set: (s: Partial<DashboardState>) => void,
  get: () => DashboardState
) {
  const payload = safePayload(get().filter);
  const mode = get().trendOverrideMode;
  const wantsOverride = mode === 'monthly' || mode === 'quarterly' || mode === 'yearly';

  const tasks: Promise<unknown>[] = [
    api.post('/api/metrik', payload, { signal }),
    api.post('/api/grafik', payload, { signal }),
    api.post('/api/peringkat', payload, { signal }),
    api.post('/api/sales-performance', payload, { signal }),
    api.post('/api/logistik', payload, { signal }),
  ];

  if (wantsOverride) {
    tasks.push(
      api.post('/api/grafik', buildTrendOverridePayload(get().filter, mode), { signal })
    );
  }

  const results = await Promise.allSettled(tasks);
  if (signal.aborted) return;

  const [rMetrik, rGrafik, rPeringkat, rSales, rLogistik, rOverride] = results;

  if (rMetrik.status === 'fulfilled') {
    const data = (rMetrik.value as { data?: MetrikResponse }).data;
    set({ metrik: data ?? get().metrik });
  } else if (!isCanceled(rMetrik.reason)) {
    console.error('metrik:', rMetrik.reason);
  }

  if (rGrafik.status === 'fulfilled') {
    const data = (rGrafik.value as { data?: GrafikItem[] }).data;
    set({ grafikDataRaw: Array.isArray(data) ? data : [] });
  } else if (!isCanceled(rGrafik.reason)) {
    console.error('grafik:', rGrafik.reason);
    set({ grafikDataRaw: [] });
  }

  if (rPeringkat.status === 'fulfilled') {
    const data = (rPeringkat.value as { data?: PeringkatItem[] }).data;
    set({ peringkat: Array.isArray(data) ? data : [] });
  } else if (!isCanceled(rPeringkat.reason)) {
    console.error('peringkat:', rPeringkat.reason);
    set({ peringkat: [] });
  }

  if (rSales.status === 'fulfilled') {
    const data = (rSales.value as { data?: SalesPerformanceResponse }).data;
    set({ salesPerformance: data ?? null, salesPerfError: '' });
  } else if (!isCanceled(rSales.reason)) {
    console.error('sales-performance:', rSales.reason);
    const err = rSales.reason as AxiosError<{ error?: string }>;
    set({
      salesPerformance: null,
      salesPerfError:
        err?.response?.data?.error || err?.message || 'Failed to load sales performance.',
    });
  }

  if (rLogistik.status === 'fulfilled') {
    const data = (rLogistik.value as { data?: LogistikItem[] }).data;
    set({ logistik: Array.isArray(data) ? data : [] });
  } else if (!isCanceled(rLogistik.reason)) {
    console.error('logistik:', rLogistik.reason);
    set({ logistik: [] });
  }

  if (wantsOverride && rOverride && rOverride.status === 'fulfilled') {
    const data = (rOverride.value as { data?: GrafikItem[] }).data;
    if (get().trendOverrideMode === mode) {
      set({ trendOverride: Array.isArray(data) ? data : [] });
    }
  } else if (
    wantsOverride &&
    rOverride &&
    rOverride.status === 'rejected' &&
    !isCanceled(rOverride.reason)
  ) {
    console.error('trend override:', rOverride.reason);
    set({ trendOverride: [] });
  }
}

async function loadDropdownOptionsImpl(
  signal: AbortSignal | undefined,
  set: (s: Partial<DashboardState>) => void,
  get: () => DashboardState
) {
  try {
    const f = safePayload(get().filter);
    const params = new URLSearchParams();
    const appendAll = (key: string, list: string[]) => {
      if (!Array.isArray(list) || list.length === 0) return;
      for (const v of list) params.append(key, v);
    };
    appendAll('channel', f.channel);
    appendAll('kanal', f.kanal);
    appendAll('nama_toko', f.nama_toko);
    appendAll('kategori', f.kategori);
    appendAll('product_name', f.product_name);
    appendAll('brand', f.brand);
    appendAll('team', f.team);
    const qs = params.toString();
    const url = qs ? `/api/options?${qs}` : '/api/options';
    const res = await api.get(url, { signal });
    const data = (res?.data ?? {}) as Partial<OptionsState>;

    const sanitize = (arr: unknown): string[] => {
      if (!Array.isArray(arr)) return [];
      const seen = new Set<string>();
      const out: string[] = [];
      for (const raw of arr) {
        const v = (raw ?? '').toString().trim();
        if (!v) continue;
        if (/^semua\b/i.test(v)) continue;
        const k = v.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(v);
      }
      return out;
    };

    set({
      options: {
        channel: sanitize(data.channel),
        kanal: sanitize(data.kanal),
        nama_toko: sanitize(data.nama_toko),
        kategori: sanitize(data.kategori),
        product_name: sanitize(data.product_name),
        brand: sanitize(data.brand),
        team: sanitize(data.team),
      },
    });
  } catch (err) {
    if (!isCanceled(err)) {
      console.error('Dropdown fetch error:', err);
    }
  }
}

export const useDashboardStore = create<DashboardState>((set, get) => {
  const initialFilter = buildDefaultFilter();
  const initialPinned = (() => {
    try {
      return localStorage.getItem('sidebar:pinned') === '1';
    } catch {
      return false;
    }
  })();

  return {
    currentUser: readUser(),
    setUser: (u) => {
      if (u) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        } catch {
          /* ignore */
        }
      }
      set({ currentUser: u });
    },
    logout: () => {
      if (masterCtrl) {
        try {
          masterCtrl.abort();
        } catch {
          /* ignore */
        }
        masterCtrl = null;
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      const fresh = buildDefaultFilter();
      set({
        currentUser: null,
        filter: fresh,
        tempFilter: deepClone(fresh),
        defaultFilter: null,
        filterApplied: false,
        filterDirty: false,
        filterBusy: false,
        filterKey: 0,
        metrik: DEFAULT_METRIK,
        peringkat: [],
        logistik: [],
        grafikDataRaw: [],
        salesPerformance: null,
        trendOverride: [],
        trendOverrideMode: '',
        dashboardReady: false,
        summaryOpen: false,
        summaryData: null,
        summaryError: '',
        progress: 0,
      });
    },

    filter: initialFilter,
    tempFilter: deepClone(initialFilter),
    defaultFilter: null,
    filterApplied: false,
    filterDirty: false,
    filterBusy: false,
    filterKey: 0,
    prevDateText: '',
    progress: 0,
    setTempFilter: (next) => {
      const active = get().filter;
      set({ tempFilter: next, filterDirty: !filtersEqual(next, active) });
    },

    options: {
      channel: [],
      kanal: [],
      nama_toko: [],
      kategori: [],
      product_name: [],
      brand: [],
      team: [],
    },

    metrik: DEFAULT_METRIK,
    peringkat: [],
    logistik: [],
    grafikDataRaw: [],
    trendOverride: [],
    trendOverrideMode: '',
    salesPerformance: null,
    salesPerfError: '',
    dashboardReady: false,

    summaryOpen: false,
    summaryLoading: false,
    summaryError: '',
    summaryData: null,
    toggleSummary: (next) =>
      set((s) => ({ summaryOpen: typeof next === 'boolean' ? next : !s.summaryOpen })),

    sidebarPinned: initialPinned,
    setSidebarPinned: (v) => {
      try {
        localStorage.setItem('sidebar:pinned', v ? '1' : '0');
      } catch {
        /* ignore */
      }
      set({ sidebarPinned: v });
    },

    loadDropdownOptions: async (signal) => {
      await loadDropdownOptionsImpl(signal, set, get);
    },

    initDashboard: async () => {
      const s = get();
      if (s.filterBusy) return;
      const range = getMonthRange();
      const user = s.currentUser;
      const locked = !!(user?.allowed_kanal && user.allowed_kanal !== 'ALL');
      const baseFilter: FilterState = {
        ...DEFAULT_FILTER,
        tanggal_mulai: range.tanggal_mulai,
        tanggal_selesai: range.tanggal_selesai,
        kanal: locked && user ? [user.allowed_kanal] : [],
        channel: locked ? ['Online'] : [],
      };
      const prev = hitungRentangSebelumnya(baseFilter.tanggal_mulai);
      set({
        filter: deepClone(baseFilter),
        tempFilter: deepClone(baseFilter),
        defaultFilter: deepClone(baseFilter),
        filterApplied: false,
        filterDirty: false,
        prevDateText: prev.text,
        dashboardReady: false,
        filterBusy: true,
      });
      startProgress(set, get);
      const signal = newRequestBatch();
      try {
        await Promise.all([
          loadDropdownOptionsImpl(signal, set, get),
          runFetchBatch(signal, set, get),
        ]);
        if (!signal.aborted) {
          set({ dashboardReady: true, filterKey: Date.now() });
        }
      } finally {
        if (!signal.aborted) {
          set({ filterBusy: false });
          finishProgress(set, get);
        }
      }
    },

    applyFilter: async (tempArg) => {
      const token = ++activeApplyToken;
      const nextFilter = tempArg ? deepClone(tempArg) : deepClone(get().tempFilter);
      const prev = hitungRentangSebelumnya(nextFilter.tanggal_mulai);
      set({
        filter: nextFilter,
        tempFilter: deepClone(nextFilter),
        filterBusy: true,
        dashboardReady: false,
        filterDirty: false,
        prevDateText: prev.text,
      });
      clearStaleData(set);
      startProgress(set, get);
      const signal = newRequestBatch();
      try {
        await Promise.all([
          loadDropdownOptionsImpl(signal, set, get),
          runFetchBatch(signal, set, get),
        ]);
        if (token !== activeApplyToken || signal.aborted) return;
        set({
          filterApplied: true,
          filterDirty: false,
          dashboardReady: true,
          filterKey: Date.now(),
        });
      } finally {
        if (token === activeApplyToken) {
          set({ filterBusy: false });
          finishProgress(set, get);
        }
      }
    },

    resetFilter: async () => {
      const token = ++activeApplyToken;
      const def = get().defaultFilter ?? buildDefaultFilter();
      const fresh = deepClone(def);
      const prev = hitungRentangSebelumnya(fresh.tanggal_mulai);
      set({
        filter: fresh,
        tempFilter: deepClone(fresh),
        filterBusy: true,
        dashboardReady: false,
        filterDirty: false,
        prevDateText: prev.text,
      });
      clearStaleData(set);
      startProgress(set, get);
      const signal = newRequestBatch();
      try {
        await Promise.all([
          loadDropdownOptionsImpl(signal, set, get),
          runFetchBatch(signal, set, get),
        ]);
        if (token !== activeApplyToken || signal.aborted) return;
        set({
          filterApplied: false,
          filterDirty: false,
          dashboardReady: true,
          filterKey: Date.now(),
        });
      } finally {
        if (token === activeApplyToken) {
          set({ filterBusy: false });
          finishProgress(set, get);
        }
      }
    },

    searchLogistik: async (query) => {
      if (logistikSearchCtrl) {
        try {
          logistikSearchCtrl.abort();
        } catch {
          /* ignore */
        }
      }
      logistikSearchCtrl = new AbortController();
      const q = String(query ?? '').trim();
      try {
        const payload = { ...safePayload(get().filter), search: q };
        const res = await api.post('/api/logistik', payload, {
          signal: logistikSearchCtrl.signal,
        });
        set({ logistik: Array.isArray(res.data) ? (res.data as LogistikItem[]) : [] });
      } catch (err) {
        if (!isCanceled(err)) {
          console.error('Logistik search error:', err);
          set({ logistik: [] });
        }
      }
    },

    openSummary: async () => {
      set({
        summaryOpen: true,
        summaryLoading: true,
        summaryError: '',
        summaryData: null,
      });
      const kanalArr = sanitizeMulti(get().filter.kanal);
      const scope = kanalArr.length === 0 ? 'Semua Kanal' : kanalArr.join(', ');
      try {
        const res = await api.post('/api/ringkasan', safePayload(get().filter));
        const r = (res.data ?? {}) as RingkasanResponse;
        set({
          summaryData: {
            scope,
            periode_sekarang: formatRangeLabel(
              r.periode_sekarang_mulai ?? '',
              r.periode_sekarang_selesai ?? ''
            ),
            periode_lalu: formatRangeLabel(
              r.periode_lalu_mulai ?? '',
              r.periode_lalu_selesai ?? ''
            ),
            omset: {
              sekarang: Number(r.total_omset) || 0,
              lalu: Number(r.total_omset_lalu) || 0,
            },
            qty: {
              sekarang: Number(r.total_qty) || 0,
              lalu: Number(r.total_qty_lalu) || 0,
            },
            per_kanal: Array.isArray(r.per_kanal)
              ? r.per_kanal.map((k) => ({
                  kanal: k.kanal || 'Unknown',
                  omset_sekarang: Number(k.omset_sekarang) || 0,
                  omset_lalu: Number(k.omset_lalu) || 0,
                }))
              : [],
            toko_top_growth: r.toko_top_growth
              ? {
                  nama_toko: r.toko_top_growth.toko,
                  kanal: r.toko_top_growth.kanal || '',
                  omset_sekarang: Number(r.toko_top_growth.omset_sekarang) || 0,
                  omset_lalu: Number(r.toko_top_growth.omset_lalu) || 0,
                }
              : null,
            toko_bottom_growth: r.toko_bottom_growth
              ? {
                  nama_toko: r.toko_bottom_growth.toko,
                  kanal: r.toko_bottom_growth.kanal || '',
                  omset_sekarang: Number(r.toko_bottom_growth.omset_sekarang) || 0,
                  omset_lalu: Number(r.toko_bottom_growth.omset_lalu) || 0,
                }
              : null,
          },
        });
      } catch (err) {
        const e = err as AxiosError<{ error?: string }>;
        set({
          summaryError:
            e?.response?.data?.error || e?.message || 'Failed to load summary.',
        });
      } finally {
        set({ summaryLoading: false });
      }
    },

    setTrendOverrideMode: async (modeRaw) => {
      const m = String(modeRaw || '').toLowerCase();
      const normalized: TrendMode =
        m === 'monthly' || m === 'quarterly' || m === 'yearly' ? m : '';
      if (get().trendOverrideMode === normalized) return;
      set({ trendOverrideMode: normalized });
      if (!normalized) {
        set({ trendOverride: [] });
        return;
      }
      if (trendCtrl) {
        try {
          trendCtrl.abort();
        } catch {
          /* ignore */
        }
      }
      trendCtrl = new AbortController();
      try {
        const res = await api.post(
          '/api/grafik',
          buildTrendOverridePayload(get().filter, normalized),
          { signal: trendCtrl.signal }
        );
        if (get().trendOverrideMode === normalized) {
          set({
            trendOverride: Array.isArray(res.data) ? (res.data as GrafikItem[]) : [],
          });
        }
      } catch (err) {
        if (!isCanceled(err)) {
          console.error('trend override:', err);
          set({ trendOverride: [] });
        }
      }
    },
  };
});
