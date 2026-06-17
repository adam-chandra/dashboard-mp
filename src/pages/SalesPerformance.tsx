import { useEffect, useMemo, useState } from 'react';
import { useOptionsQuery, useSalesPerformanceQuery } from '../hooks/useAnalyticsQueries';
import { useDashboardStore } from '../store/dashboard';
import { ContribChart } from '../components/ContribChart';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { formatRupiahShort } from '../lib/format';
import { formatRangeLabel } from '../lib/date';

type ContribDim = 'brand' | 'kanal' | 'kategori';

export default function SalesPerformance() {
  useOptionsQuery();
  const sp = useSalesPerformanceQuery(true);
  const setProgress = useDashboardStore((s) => s.setProgress);
  const [activeDim, setActiveDim] = useState<ContribDim>('brand');

  useEffect(() => {
    setProgress(sp.isFetching ? 50 : 100);
  }, [sp.isFetching, setProgress]);

  const contribData = useMemo(() => {
    if (!sp.data) return [];
    if (activeDim === 'brand') return sp.data.contrib_by_brand;
    if (activeDim === 'kanal') return sp.data.contrib_by_kanal;
    return sp.data.contrib_by_kategori;
  }, [sp.data, activeDim]);

  return (
    <div className="flex flex-col gap-5">
      {/* Periode summary */}
      <section className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-wrap items-center gap-4 justify-between">
        <div>
          <div className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Periode</div>
          <div className="text-sm text-zinc-800">
            {formatRangeLabel(
              sp.data?.periode_sekarang_mulai ?? '',
              sp.data?.periode_sekarang_selesai ?? ''
            )}
          </div>
          <div className="text-xs text-zinc-400">
            vs {formatRangeLabel(sp.data?.periode_lalu_mulai ?? '', sp.data?.periode_lalu_selesai ?? '')}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Total Omset</div>
          <div className="text-xl font-bold text-zinc-800 font-mono">
            {formatRupiahShort(sp.data?.total_omset ?? 0)}
          </div>
        </div>
      </section>

      {/* Contribution */}
      <section className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold tracking-wider text-zinc-700 uppercase">
            Kontribusi Omset
          </h2>
          <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg">
            {(['brand', 'kanal', 'kategori'] as ContribDim[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDim(d)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  activeDim === d ? 'bg-white text-zinc-900 shadow' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {d[0].toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <ContribChart
          title={`Kontribusi per ${activeDim}`}
          data={contribData}
          loading={sp.isFetching}
        />
      </section>

      {/* Geo top */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-xs font-bold tracking-wider text-zinc-700 uppercase mb-3">
            Top Provinsi
          </h3>
          <ul className="divide-y divide-zinc-100">
            {(sp.data?.top_provinsi ?? []).slice(0, 10).map((p, i) => (
              <li key={`${p.wilayah}-${i}`} className="py-2 flex items-center gap-3 text-sm">
                <span className="w-6 text-center text-xs font-bold text-zinc-500">{i + 1}</span>
                <span className="flex-1 text-zinc-800 truncate">{p.wilayah}</span>
                <span className="font-mono text-zinc-700">{formatRupiahShort(p.omset)}</span>
              </li>
            ))}
            {sp.data?.top_provinsi?.length === 0 && (
              <li className="py-6 text-center text-xs text-zinc-400">Tidak ada data.</li>
            )}
          </ul>
        </div>
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-xs font-bold tracking-wider text-zinc-700 uppercase mb-3">
            Top Kota / Kab
          </h3>
          <ul className="divide-y divide-zinc-100">
            {(sp.data?.top_kota ?? []).slice(0, 10).map((p, i) => (
              <li key={`${p.wilayah}-${i}`} className="py-2 flex items-center gap-3 text-sm">
                <span className="w-6 text-center text-xs font-bold text-zinc-500">{i + 1}</span>
                <span className="flex-1 text-zinc-800 truncate">{p.wilayah}</span>
                <span className="font-mono text-zinc-700">{formatRupiahShort(p.omset)}</span>
              </li>
            ))}
            {sp.data?.top_kota?.length === 0 && (
              <li className="py-6 text-center text-xs text-zinc-400">Tidak ada data.</li>
            )}
          </ul>
        </div>
      </section>

      {/* Hero products */}
      <section className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
        <h2 className="text-xs font-bold tracking-wider text-zinc-700 uppercase mb-3">Hero Products</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="text-left px-3 py-2">Produk</th>
                <th className="text-left px-3 py-2">Brand</th>
                <th className="text-left px-3 py-2">Kategori</th>
                <th className="text-right px-3 py-2">GMV</th>
                <th className="text-right px-3 py-2">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(sp.data?.hero_products ?? []).map((p, i) => (
                <tr key={`${p.product_name}-${i}`}>
                  <td className="px-3 py-2 text-zinc-800 max-w-[280px] truncate">{p.product_name}</td>
                  <td className="px-3 py-2 text-zinc-600">{p.brand}</td>
                  <td className="px-3 py-2 text-zinc-600">{p.kategori}</td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-800">
                    {formatRupiahShort(p.gmv)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-700">
                    {(p.share ?? 0).toFixed(2)}%
                  </td>
                </tr>
              ))}
              {!sp.data?.hero_products?.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-zinc-400">
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Leaderboard */}
      <LeaderboardTable data={sp.data?.leaderboard} loading={sp.isFetching} />
    </div>
  );
}
