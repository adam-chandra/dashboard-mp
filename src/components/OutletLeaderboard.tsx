import { memo, useMemo } from 'react';
import type { PeringkatItem } from '../types';
import { formatRupiahShort, growthClass, growthLabel } from '../lib/format';

interface Props {
  data: PeringkatItem[] | undefined;
  loading?: boolean;
}

function OutletLeaderboardImpl({ data, loading }: Props) {
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  return (
    <section className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold tracking-widest text-zinc-700 uppercase border-l-2 border-indigo-500 pl-2">
          Store Performance Leaderboard
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
            {rows.length} STORE
          </span>
          {loading && (
            <span className="text-[10px] font-mono text-zinc-400 animate-pulse uppercase tracking-widest">
              memuat
            </span>
          )}
        </div>
      </div>
      <div className="overflow-y-auto max-h-[420px] rounded-lg border border-zinc-200 bg-zinc-50/50 custom-scroll">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-zinc-100 text-[10px] uppercase tracking-widest text-zinc-500 font-bold shadow-sm">
            <tr>
              <th className="px-3 py-2 w-12 text-left">No</th>
              <th className="px-3 py-2 text-left">Store Name</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">Total Omset</th>
              <th className="px-3 py-2 text-right whitespace-nowrap w-32">Growth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading && rows.length === 0 &&
              Array.from({ length: 6 }).map((_, n) => (
                <tr key={`sk-${n}`} className="animate-pulse">
                  <td className="px-3 py-2"><div className="h-3 w-4 mx-auto rounded bg-zinc-200" /></td>
                  <td className="px-3 py-2"><div className="h-3 w-40 rounded bg-zinc-200" /></td>
                  <td className="px-3 py-2"><div className="h-3 w-20 ml-auto rounded bg-zinc-200" /></td>
                  <td className="px-3 py-2"><div className="h-3 w-12 ml-auto rounded bg-zinc-200" /></td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-zinc-400 font-mono">
                  No record matching filters.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={`${r.nama_toko}-${i}`} className="hover:bg-zinc-50 transition">
                <td className="px-3 py-2 font-mono text-zinc-400 font-bold">{i + 1}</td>
                <td className="px-3 py-2 font-bold text-zinc-700 tracking-wide uppercase truncate max-w-[420px]">
                  {r.nama_toko || '-'}
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-zinc-900 tabular-nums whitespace-nowrap">
                  {formatRupiahShort(r.gmv_total)}
                </td>
                <td className={`px-3 py-2 text-right font-mono font-bold tabular-nums whitespace-nowrap ${growthClass(r.growth ?? 0)}`}>
                  {growthLabel(r.growth ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export const OutletLeaderboard = memo(OutletLeaderboardImpl);
