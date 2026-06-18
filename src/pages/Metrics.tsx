import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { HeaderAnalytics } from '../components/HeaderAnalytics';
import { useDashboardStore } from '../store/dashboard';
import { SEARCH_DEBOUNCE_MS } from '../constants';
import type { LogistikItem } from '../types';

const PAGE_SIZE = 30;

function formatTanggal(raw: string | undefined): string {
  const s = String(raw || '').trim();
  if (!s) return '-';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({
  label,
  tone,
}: {
  label: string | undefined;
  tone: 'sky' | 'violet' | 'blue';
}) {
  const v = String(label || '').trim();
  if (!v || v === '-' || /^null$/i.test(v) || /^unknown/i.test(v)) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-zinc-50 text-zinc-400 border border-zinc-200">
        N/A
      </span>
    );
  }
  const palette: Record<typeof tone, string> = {
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    violet: 'bg-violet-100 text-violet-700 border-violet-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${palette[tone]}`}
      title={v}
    >
      {v}
    </span>
  );
}

export default function Metrics() {
  const logistik = useDashboardStore((s) => s.logistik);
  const dashboardReady = useDashboardStore((s) => s.dashboardReady);
  const filterBusy = useDashboardStore((s) => s.filterBusy);
  const searchLogistik = useDashboardStore((s) => s.searchLogistik);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [searchBusy, setSearchBusy] = useState(false);

  useEffect(() => {
    if (!dashboardReady) return;
    let cancelled = false;
    setSearchBusy(true);
    void (async () => {
      try {
        await searchLogistik(debounced);
      } finally {
        if (!cancelled) setSearchBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced, dashboardReady, searchLogistik]);

  useEffect(() => {
    setPage(1);
  }, [debounced, logistik]);

  const loading = !dashboardReady || filterBusy || searchBusy;

  const rows: LogistikItem[] = useMemo(
    () => (Array.isArray(logistik) ? logistik : []),
    [logistik]
  );
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const start = (page - 1) * PAGE_SIZE;
  const paged = useMemo(() => rows.slice(start, start + PAGE_SIZE), [rows, start]);
  const rangeStart = rows.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + PAGE_SIZE, rows.length);

  return (
    <div className="flex flex-col gap-5">
      <HeaderAnalytics title="METRICS" />

      <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xs font-bold tracking-widest text-zinc-700 uppercase border-l-2 border-indigo-500 pl-2">
              Logistik Orders
            </h2>
            <p className="text-[10px] font-mono text-zinc-400 mt-1 pl-2">
              Detail order dan tracking status pada periode aktif.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari order / outlet / kanal…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            {searchBusy && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="text-left px-3 py-2 w-12">No</th>
                <th className="text-left px-3 py-2 w-28">Tanggal</th>
                <th className="text-left px-3 py-2 w-40">Order Number</th>
                <th className="text-left px-3 py-2">Distribution Outlet</th>
                <th className="text-left px-3 py-2 w-32">Kanal</th>
                <th className="text-left px-3 py-2 w-32">Status Standard</th>
                <th className="text-left px-3 py-2 w-32">Status Toko</th>
                <th className="text-left px-3 py-2 w-32">Status WMS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading && paged.length === 0 &&
                Array.from({ length: 8 }).map((_, n) => (
                  <tr key={`sk-${n}`} className="animate-pulse">
                    <td colSpan={8} className="px-3 py-3">
                      <div className="h-3 bg-zinc-100 rounded w-full" />
                    </td>
                  </tr>
                ))}
              {!loading && paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-zinc-400">
                    Tidak ada data pada filter ini.
                  </td>
                </tr>
              )}
              {paged.map((r, i) => (
                <tr key={`${r.order_number}-${start + i}`} className="hover:bg-zinc-50/60">
                  <td className="px-3 py-2 font-mono text-zinc-500">{start + i + 1}</td>
                  <td className="px-3 py-2 font-mono text-zinc-700">{formatTanggal(r.tanggal)}</td>
                  <td className="px-3 py-2 font-mono text-zinc-800 truncate" title={r.order_number}>
                    {r.order_number || '-'}
                  </td>
                  <td className="px-3 py-2 text-zinc-700 truncate" title={r.nama_toko}>
                    {r.nama_toko || '-'}
                  </td>
                  <td className="px-3 py-2 text-zinc-700 truncate" title={r.kanal}>
                    {r.kanal || '-'}
                  </td>
                  <td className="px-3 py-2"><StatusBadge label={r.status_fix} tone="sky" /></td>
                  <td className="px-3 py-2"><StatusBadge label={r.status_3pl} tone="violet" /></td>
                  <td className="px-3 py-2"><StatusBadge label={r.status_wms} tone="blue" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-3 border-t border-zinc-100">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
            <span>Showing</span>
            <span className="text-zinc-700 font-bold mx-1">{rangeStart}-{rangeEnd}</span>
            <span>of</span>
            <span className="text-zinc-700 font-bold mx-1">{rows.length}</span>
            <span>records</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-bold tracking-widest uppercase text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹ Prev
            </button>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-mono font-bold text-zinc-700 tabular-nums min-w-[90px] text-center">
              {page} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-bold tracking-widest uppercase text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next ›
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
