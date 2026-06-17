import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { useDashboardStore } from '../store/dashboard';

interface Props {
  loading?: boolean;
  onOpenSummary?: () => void;
}

function HeaderAnalyticsImpl({ loading, onOpenSummary }: Props) {
  const navigate = useNavigate();
  const tempFilter = useDashboardStore((s) => s.tempFilter);
  const setTempFilter = useDashboardStore((s) => s.setTempFilter);
  const applyFilter = useDashboardStore((s) => s.applyFilter);
  const resetFilter = useDashboardStore((s) => s.resetFilter);
  const filterApplied = useDashboardStore((s) => s.filterApplied);
  const filterDirty = useDashboardStore((s) => s.filterDirty);
  const progress = useDashboardStore((s) => s.progress);
  const options = useDashboardStore((s) => s.options);
  const currentUser = useDashboardStore((s) => s.currentUser);
  const logout = useDashboardStore((s) => s.logout);

  const setField = useCallback(
    <K extends keyof typeof tempFilter>(key: K, value: (typeof tempFilter)[K]) => {
      setTempFilter({ ...tempFilter, [key]: value });
    },
    [tempFilter, setTempFilter]
  );

  const isRefresh = filterApplied && !filterDirty;
  const filterBtnClass = isRefresh
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
    : 'bg-zinc-900 hover:bg-black text-white';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white/90 backdrop-blur border-b border-zinc-200 p-4 sticky top-0 z-20">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-end">
        <div>
          <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block mb-1">
            Mulai
          </label>
          <input
            type="date"
            value={tempFilter.tanggal_mulai}
            onChange={(e) => setField('tanggal_mulai', e.target.value)}
            className="w-full h-10 px-2 rounded-lg border border-zinc-300 text-sm bg-white"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block mb-1">
            Selesai
          </label>
          <input
            type="date"
            value={tempFilter.tanggal_selesai}
            onChange={(e) => setField('tanggal_selesai', e.target.value)}
            className="w-full h-10 px-2 rounded-lg border border-zinc-300 text-sm bg-white"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block mb-1">
            Kanal
          </label>
          <MultiSelectDropdown
            noun="kanal"
            modelValue={tempFilter.kanal}
            options={options.kanal}
            onChange={(v) => setField('kanal', v)}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block mb-1">
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
          <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block mb-1">
            Produk
          </label>
          <MultiSelectDropdown
            noun="produk"
            modelValue={tempFilter.product_name}
            options={options.product_name}
            onChange={(v) => setField('product_name', v)}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block mb-1">
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
          <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block mb-1">
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
          <label className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block mb-1">
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

      <div className="mt-3 flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {currentUser && (
            <span className="px-2 py-1 rounded bg-zinc-100">
              Login: <b className="text-zinc-800">{currentUser.email}</b>
              <span className="ml-1 text-zinc-400">({currentUser.role})</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetFilter}
            className="px-3 h-10 rounded-lg text-sm border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={onOpenSummary}
            className="px-3 h-10 rounded-lg text-sm text-white font-medium
              bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
              hover:opacity-90 shadow-sm"
          >
            AI Summary
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={applyFilter}
            className={`px-4 h-10 rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-60 ${filterBtnClass}`}
          >
            {loading
              ? `Loading… ${progress}%`
              : isRefresh
              ? 'REFRESH'
              : 'TERAPKAN FILTER'}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className="px-3 h-10 rounded-lg text-sm border border-zinc-300 bg-white hover:bg-rose-50 text-rose-600"
          >
            Logout
          </button>
        </div>
      </div>

      {loading && (
        <div className="mt-2 h-1 w-full bg-zinc-100 rounded overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </header>
  );
}

export const HeaderAnalytics = memo(HeaderAnalyticsImpl);
