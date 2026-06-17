import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useLogistikQuery, useOptionsQuery } from '../hooks/useAnalyticsQueries';
import { SEARCH_DEBOUNCE_MS } from '../constants';
import { VirtualizedLogistikTable } from '../components/VirtualizedLogistikTable';
import { useDashboardStore } from '../store/dashboard';

export default function Metrics() {
  useOptionsQuery();
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const logistik = useLogistikQuery(debounced, true);
  const setProgress = useDashboardStore((s) => s.setProgress);

  useEffect(() => {
    setProgress(logistik.isFetching ? 60 : 100);
  }, [logistik.isFetching, setProgress]);

  const count = useMemo(() => logistik.data?.length ?? 0, [logistik.data]);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-800">Logistik Orders</h2>
          <p className="text-xs text-zinc-500">
            {logistik.isFetching ? 'Memuat…' : `${count.toLocaleString('id-ID')} baris ditampilkan`}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari order number / outlet / kanal…"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <VirtualizedLogistikTable data={logistik.data} loading={logistik.isFetching} height={600} />
    </div>
  );
}
