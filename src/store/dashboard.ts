import { create } from 'zustand';
import type { FilterState, OptionsState, User } from '../types';
import { DEFAULT_FILTER } from '../constants';
import { getMonthRange } from '../lib/date';
import { filtersEqual } from '../lib/filters';

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

function buildDefaultFilter(): FilterState {
  const range = getMonthRange();
  return {
    ...DEFAULT_FILTER,
    tanggal_mulai: range.tanggal_mulai,
    tanggal_selesai: range.tanggal_selesai,
  };
}

interface DashboardState {
  // Auth
  currentUser: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;

  // Filter — `filter` adalah filter yang sedang aktif (sudah di-apply);
  // `tempFilter` adalah filter yang sedang dirakit user di HeaderAnalytics.
  filter: FilterState;
  tempFilter: FilterState;
  setTempFilter: (next: FilterState) => void;
  applyFilter: () => void;
  resetFilter: () => void;
  filterApplied: boolean;
  filterKey: number; // bump tiap apply untuk men-trigger refetch
  filterDirty: boolean; // tempFilter berbeda dari filter aktif

  // Options
  options: OptionsState;
  setOptions: (o: Partial<OptionsState>) => void;

  // UI
  summaryOpen: boolean;
  toggleSummary: (next?: boolean) => void;
  sidebarPinned: boolean;
  setSidebarPinned: (v: boolean) => void;
  progress: number;
  setProgress: (n: number) => void;
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
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      set({ currentUser: null });
    },
    isAuthenticated: () => !!get().currentUser,

    filter: initialFilter,
    tempFilter: initialFilter,
    setTempFilter: (next) => {
      const active = get().filter;
      set({ tempFilter: next, filterDirty: !filtersEqual(next, active) });
    },
    applyFilter: () => {
      const t = get().tempFilter;
      set((s) => ({
        filter: t,
        filterApplied: true,
        filterDirty: false,
        filterKey: s.filterKey + 1,
      }));
    },
    resetFilter: () => {
      const fresh = buildDefaultFilter();
      set((s) => ({
        filter: fresh,
        tempFilter: fresh,
        filterApplied: false,
        filterDirty: false,
        filterKey: s.filterKey + 1,
      }));
    },
    filterApplied: false,
    filterKey: 0,
    filterDirty: false,

    options: {
      channel: [],
      kanal: [],
      nama_toko: [],
      kategori: [],
      product_name: [],
      brand: [],
      team: [],
    },
    setOptions: (o) => set((s) => ({ options: { ...s.options, ...o } })),

    summaryOpen: false,
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

    progress: 0,
    setProgress: (n) => set({ progress: Math.max(0, Math.min(100, n)) }),
  };
});
