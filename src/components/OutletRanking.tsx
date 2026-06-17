import { memo } from 'react';
import type { PeringkatItem } from '../types';
import { formatRupiahShort, growthClass, growthLabel } from '../lib/format';

interface Props {
  data: PeringkatItem[] | undefined;
  loading?: boolean;
}

function OutletRankingImpl({ data, loading }: Props) {
  const rows = data ?? [];
  return (
    <section className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold tracking-wider text-zinc-700 uppercase">Peringkat Outlet</h2>
        {loading && <span className="text-xs text-zinc-400 animate-pulse">memuat…</span>}
      </div>

      <ul className="divide-y divide-zinc-100">
        {rows.length === 0 && !loading && (
          <li className="py-6 text-center text-xs text-zinc-400">Tidak ada data.</li>
        )}
        {rows.slice(0, 12).map((r, idx) => (
          <li key={`${r.nama_toko}-${idx}`} className="py-2 flex items-center gap-3">
            <span className="w-6 text-center text-xs font-bold text-zinc-500">{idx + 1}</span>
            <span className="flex-1 text-sm text-zinc-800 truncate">{r.nama_toko}</span>
            <span className="font-mono text-sm text-zinc-800">
              {formatRupiahShort(r.gmv_total)}
            </span>
            <span className={`w-20 text-right text-xs font-medium ${growthClass(r.growth ?? 0)}`}>
              {growthLabel(r.growth ?? 0)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const OutletRanking = memo(OutletRankingImpl);
