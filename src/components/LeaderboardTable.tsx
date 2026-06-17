import { memo, useMemo } from 'react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import type { LeaderboardItem } from '../types';
import { formatRupiahShort, growthClass, growthLabel } from '../lib/format';

interface Props {
  data: LeaderboardItem[] | undefined;
  loading?: boolean;
}

const ROW_H = 44;

function Row({ index, style, data }: ListChildComponentProps<LeaderboardItem[]>) {
  const r = data[index];
  if (!r) return null;
  return (
    <div
      style={style}
      className={`grid grid-cols-[40px_minmax(0,1fr)_120px_120px_110px_110px] items-center gap-2 px-3 text-xs ${
        index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/60'
      }`}
    >
      <div className="font-mono text-zinc-500">{r.peringkat}</div>
      <div className="min-w-0">
        <div className="truncate text-zinc-800 font-medium">{r.product_name}</div>
        <div className="truncate text-[10px] text-zinc-400">{r.brand}</div>
      </div>
      <div className="text-right font-mono text-zinc-800">{formatRupiahShort(r.gmv)}</div>
      <div className="text-right font-mono text-zinc-500">{formatRupiahShort(r.gmv_lalu)}</div>
      <div className={`text-right ${growthClass(r.growth ?? 0)}`}>{growthLabel(r.growth ?? 0)}</div>
      <div className="text-right font-mono text-zinc-700">{formatRupiahShort(r.aov ?? 0)}</div>
    </div>
  );
}

function LeaderboardTableImpl({ data, loading }: Props) {
  const rows = useMemo(() => data ?? [], [data]);
  const height = Math.min(8 * ROW_H, Math.max(ROW_H, rows.length * ROW_H));

  return (
    <section className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold tracking-wider text-zinc-700 uppercase">Leaderboard Produk</h2>
        {loading && <span className="text-xs text-zinc-400 animate-pulse">memuat…</span>}
      </div>

      <div className="grid grid-cols-[40px_minmax(0,1fr)_120px_120px_110px_110px] gap-2 px-3 py-2 text-[10px] font-bold tracking-wider text-zinc-500 uppercase border-b border-zinc-200">
        <div>#</div>
        <div>Produk</div>
        <div className="text-right">GMV</div>
        <div className="text-right">GMV Lalu</div>
        <div className="text-right">Growth</div>
        <div className="text-right">AOV</div>
      </div>

      {rows.length === 0 ? (
        <div className="py-6 text-center text-xs text-zinc-400">Tidak ada data.</div>
      ) : (
        <FixedSizeList
          height={height}
          itemCount={rows.length}
          itemSize={ROW_H}
          width="100%"
          itemData={rows}
        >
          {Row}
        </FixedSizeList>
      )}
    </section>
  );
}

export const LeaderboardTable = memo(LeaderboardTableImpl);
