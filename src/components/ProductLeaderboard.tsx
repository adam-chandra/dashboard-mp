import { memo, useEffect, useMemo, useState } from 'react';
import type { LeaderboardItem } from '../types';
import {
  formatRupiahShort,
  growthClass,
  growthLabel,
} from '../lib/format';

interface Props {
  data: LeaderboardItem[] | undefined;
  loading?: boolean;
}

const PAGE_SIZE = 10;

function ProductLeaderboardImpl({ data, loading }: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r?.product_name && r.product_name.toLowerCase().includes(q)) ||
        (r?.brand && r.brand.toLowerCase().includes(q))
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  useEffect(() => {
    setPage(1);
  }, [search, data]);

  const start = (page - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + PAGE_SIZE, filtered.length);

  return (
    <section className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <h2 className="text-xs font-bold tracking-widest text-zinc-700 uppercase border-l-2 border-indigo-500 pl-2">
            Product Leaderboard
          </h2>
          <p className="text-[10px] font-mono text-zinc-400 mt-1 pl-2">
            Ranking produk berdasarkan GMV pada periode aktif.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk / brand…"
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-zinc-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <svg
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="text-left px-3 py-2 w-12">No</th>
              <th className="text-left px-3 py-2">Produk</th>
              <th className="text-left px-3 py-2 w-44">Brand</th>
              <th className="text-right px-3 py-2 w-32">GMV</th>
              <th className="text-right px-3 py-2 w-32">Growth</th>
              <th className="text-right px-3 py-2 w-28">AOV</th>
              <th className="text-right px-3 py-2 w-28">ASP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading && paged.length === 0 &&
              Array.from({ length: 5 }).map((_, n) => (
                <tr key={`sk-${n}`} className="animate-pulse">
                  <td colSpan={7} className="px-3 py-3">
                    <div className="h-3 bg-zinc-100 rounded w-full" />
                  </td>
                </tr>
              ))}
            {!loading && paged.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-zinc-400">
                  Tidak ada produk yang cocok dengan pencarian Anda.
                </td>
              </tr>
            )}
            {paged.map((r) => (
              <tr key={`${r.peringkat}-${r.product_name}`} className="hover:bg-zinc-50/60">
                <td className="px-3 py-2 font-mono text-zinc-500">{r.peringkat}</td>
                <td className="px-3 py-2 text-zinc-800 max-w-[420px] truncate" title={r.product_name}>
                  {r.product_name}
                </td>
                <td className="px-3 py-2 text-zinc-600">{r.brand || '-'}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-zinc-800 tabular-nums">
                  {formatRupiahShort(r.gmv)}
                </td>
                <td className={`px-3 py-2 text-right font-bold ${growthClass(r.growth ?? 0)}`}>
                  {growthLabel(r.growth ?? 0)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-zinc-700">
                  {formatRupiahShort(r.aov ?? 0)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-zinc-700">
                  {formatRupiahShort(r.asp ?? 0)}
                </td>
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
          <span className="text-zinc-700 font-bold mx-1">{filtered.length}</span>
          <span>products</span>
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
          <div className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-mono font-bold text-zinc-700 tabular-nums min-w-[80px] text-center">
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
  );
}

export const ProductLeaderboard = memo(ProductLeaderboardImpl);
