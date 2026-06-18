import { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { useDashboardStore } from '../store/dashboard';
import type { FilterState } from '../types';

interface Props {
  title: string;
  onOpenSummary?: () => void;
}

function HeaderAnalyticsImpl({ title, onOpenSummary }: Props) {
  const navigate = useNavigate();
  const tempFilter = useDashboardStore((s) => s.tempFilter);
  const setTempFilter = useDashboardStore((s) => s.setTempFilter);
  const applyFilter = useDashboardStore((s) => s.applyFilter);
  const resetFilter = useDashboardStore((s) => s.resetFilter);
  const filter = useDashboardStore((s) => s.filter);
  const filterApplied = useDashboardStore((s) => s.filterApplied);
  const filterDirty = useDashboardStore((s) => s.filterDirty);
  const filterBusy = useDashboardStore((s) => s.filterBusy);
  const filterKey = useDashboardStore((s) => s.filterKey);
  const progress = useDashboardStore((s) => s.progress);
  const summaryLoading = useDashboardStore((s) => s.summaryLoading);
  const options = useDashboardStore((s) => s.options);
  const currentUser = useDashboardStore((s) => s.currentUser);
  const logout = useDashboardStore((s) => s.logout);
  const openSummary = useDashboardStore((s) => s.openSummary);

  const isKanalLocked = useMemo(
    () => !!(currentUser?.allowed_kanal && currentUser.allowed_kanal !== 'ALL'),
    [currentUser]
  );

  const kanalOptionList = useMemo(() => {
    if (isKanalLocked && currentUser?.allowed_kanal) return [currentUser.allowed_kanal];
    return options.kanal || [];
  }, [isKanalLocked, currentUser, options.kanal]);

  const kanalHeaderLabel = useMemo(() => {
    const arr = Array.isArray(filter.kanal) ? filter.kanal : [];
    if (arr.length === 0) return 'SEMUA KANAL';
    if (arr.length <= 2) return arr.map((s) => String(s).toUpperCase()).join(', ');
    return `${arr.length} KANAL TERPILIH`;
  }, [filter.kanal]);

  const kanalScopeLabel = useMemo(() => {
    if (!currentUser) return '';
    const k = currentUser.allowed_kanal;
    return !k || k === 'ALL' ? 'ALL CHANNELS' : `SCOPE: ${String(k).toUpperCase()}`;
  }, [currentUser]);

  const setField = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setTempFilter({ ...tempFilter, [key]: value });
    },
    [tempFilter, setTempFilter]
  );

  const showRefreshMode = filterApplied && !filterDirty;

  const handleFilterClick = () => {
    if (filterBusy) return;
    void applyFilter(tempFilter);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSummary = () => {
    if (summaryLoading) return;
    void openSummary();
    onOpenSummary?.();
  };

  const filterButtonBase =
    'relative overflow-hidden inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm';
  const filterButtonColor = filterBusy
    ? 'bg-zinc-800 text-white'
    : showRefreshMode
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-zinc-900 hover:bg-zinc-800 text-white';

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm">
      <div className="px-5 py-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/ethos_logo.png" alt="Ethos" className="w-9 h-9 rounded" />
          <div>
            <h1 className="text-sm font-black tracking-widest text-zinc-900 uppercase">
              {title}
            </h1>
            <div className="text-[10px] font-mono text-zinc-400 mt-0.5 flex flex-wrap items-center gap-2">
              <span>
                SCOPE ACTIVE:{' '}
                <span className="text-zinc-700 font-bold">{kanalHeaderLabel}</span>
              </span>
              <span className="text-zinc-300">|</span>
              <span>
                PERIOD:{' '}
                <span className="text-zinc-700 font-bold">
                  {filter.tanggal_mulai || '—'}
                </span>{' '}
                TO{' '}
                <span className="text-zinc-700 font-bold">
                  {filter.tanggal_selesai || '—'}
                </span>
              </span>
              {kanalScopeLabel && (
                <>
                  <span className="text-zinc-300">|</span>
                  <span
                    className={
                      isKanalLocked
                        ? 'inline-flex items-center gap-1 text-amber-600 font-bold'
                        : 'text-emerald-600 font-bold'
                    }
                  >
                    {isKanalLocked && (
                      <svg
                        viewBox="0 0 24 24"
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          d="M5 11h14v10H5zM7 11V7a5 5 0 0 1 10 0v4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {kanalScopeLabel}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {currentUser && (
            <div className="text-right leading-tight">
              <div className="text-zinc-800 font-bold">{currentUser.email}</div>
              <div className="text-zinc-400 font-mono">{currentUser.role}</div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-zinc-200 text-zinc-600 text-xs font-bold uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-end">
          <div>
            <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={tempFilter.tanggal_mulai}
              onChange={(e) => setField('tanggal_mulai', e.target.value)}
              className="w-full h-10 px-2 rounded-lg border border-zinc-300 text-sm bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block mb-1">
              End Date
            </label>
            <input
              type="date"
              value={tempFilter.tanggal_selesai}
              onChange={(e) => setField('tanggal_selesai', e.target.value)}
              className="w-full h-10 px-2 rounded-lg border border-zinc-300 text-sm bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1 flex items-center gap-1">
              Media Kanal
              {isKanalLocked && (
                <span className="text-[9px] font-mono bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                  LOCKED
                </span>
              )}
            </label>
            <MultiSelectDropdown
              key={`kanal-${filterKey}`}
              noun="kanal"
              modelValue={tempFilter.kanal}
              options={kanalOptionList}
              disabled={isKanalLocked}
              onChange={(v) => setField('kanal', v)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block mb-1">
              Kategori
            </label>
            <MultiSelectDropdown
              noun="kategori"
              modelValue={tempFilter.kategori}
              options={options.kategori}
              onChange={(v) => setField('kategori', v)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block mb-1">
              Product Name
            </label>
            <MultiSelectDropdown
              noun="produk"
              modelValue={tempFilter.product_name}
              options={options.product_name}
              onChange={(v) => setField('product_name', v)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block mb-1">
              Brand
            </label>
            <MultiSelectDropdown
              noun="brand"
              modelValue={tempFilter.brand}
              options={options.brand}
              onChange={(v) => setField('brand', v)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block mb-1">
              Team
            </label>
            <MultiSelectDropdown
              noun="team"
              modelValue={tempFilter.team}
              options={options.team}
              onChange={(v) => setField('team', v)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block mb-1">
              Toko
            </label>
            <MultiSelectDropdown
              noun="toko"
              modelValue={tempFilter.nama_toko}
              options={options.nama_toko}
              onChange={(v) => setField('nama_toko', v)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => void resetFilter()}
            disabled={filterBusy}
            className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl border border-zinc-200 text-zinc-600 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
              <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="3 4 3 10 9 10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Reset
          </button>

          <button
            type="button"
            onClick={handleSummary}
            disabled={summaryLoading || filterBusy}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-bold uppercase tracking-widest text-white shadow-sm bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 disabled:opacity-60"
          >
            {summaryLoading ? (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.4}>
                <path d="M21 12a9 9 0 1 1-6.2-8.55" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
                <path d="M12 2l1.6 4.6L18 8l-4.4 1.4L12 14l-1.6-4.6L6 8l4.4-1.4z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            AI Summary
          </button>

          <button
            type="button"
            onClick={handleFilterClick}
            disabled={filterBusy}
            className={`${filterButtonBase} ${filterButtonColor}`}
          >
            {filterBusy && (
              <span
                aria-hidden
                className="absolute inset-0 bg-emerald-400/40 transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            )}
            <span className="relative inline-flex items-center gap-2">
              {filterBusy ? (
                <>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.4}>
                    <path d="M21 12a9 9 0 1 1-6.2-8.55" strokeLinecap="round" />
                  </svg>
                  Loading {progress}%
                </>
              ) : showRefreshMode ? (
                <>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
                    <path d="M21 12a9 9 0 1 1-3-6.7" strokeLinecap="round" />
                    <polyline points="21 3 21 9 15 9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Refresh
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
                    <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 2l-7 20-4-9-9-4z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Apply Filter
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

export const HeaderAnalytics = memo(HeaderAnalyticsImpl);

