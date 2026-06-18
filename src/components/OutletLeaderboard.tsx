import { memo, useMemo } from 'react';
import type { PeringkatItem } from '../types';
import { formatRupiahShort, growthClass, growthLabel } from '../lib/format';

interface Props {
  data: PeringkatItem[] | undefined;
  loading?: boolean;
}

function OutletLeaderboardImpl({ data, loading }: Props) {
  const rows = useMemo(() => (data ?? []).slice(0, 12), [data]);
  return (
    <section className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold tracking-widest text-zinc-700 uppercase border-l-2 border-indigo-500 pl-2">
          Store Performance Leaderboard
        </h2>
        {loading && (
          <span className="text-[10px] font-mono text-zinc-400 animate-pulse uppercase tracking-widest">
            memuat
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-zinc-200">
            <tr>
              <th className="text-left px-3 py-2 w-12">No</th>
              <th className="text-left px-3 py-2">Store Name</th>
              <th className="text-right px-3 py-2">Total Omset</th>
              <th className="text-right px-3 py-2 w-32">Growth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-zinc-400">
                  Tidak ada data.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={`${r.nama_toko}-${i}`} className="hover:bg-zinc-50/60">
                <td className="px-3 py-2 font-mono text-zinc-500">{i + 1}</td>
                <td className="px-3 py-2 text-zinc-800 truncate max-w-[420px]">
                  {r.nama_toko}
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold text-zinc-800 tabular-nums">
                  {formatRupiahShort(r.gmv_total)}
                </td>
                <td className={`px-3 py-2 text-right font-bold ${growthClass(r.growth ?? 0)}`}>
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
