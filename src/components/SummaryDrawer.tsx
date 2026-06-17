import { memo, useMemo } from 'react';
import { useRingkasanQuery } from '../hooks/useAnalyticsQueries';
import { useDashboardStore } from '../store/dashboard';
import {
  calcGrowth,
  formatAngka,
  formatRupiahShort,
  growthClass,
  growthLabel,
  growthVerb,
} from '../lib/format';
import { sanitizeMulti } from '../lib/filters';

function SummaryDrawerImpl() {
  const open = useDashboardStore((s) => s.summaryOpen);
  const toggle = useDashboardStore((s) => s.toggleSummary);
  const filter = useDashboardStore((s) => s.filter);

  const isAllKanal = sanitizeMulti(filter.kanal).length === 0;
  const { data, isFetching, isError, refetch } = useRingkasanQuery(open);

  const totalGrowth = useMemo(
    () => calcGrowth(data?.total_omset ?? 0, data?.total_omset_lalu ?? 0),
    [data]
  );
  const qtyGrowth = useMemo(
    () => calcGrowth(data?.total_qty ?? 0, data?.total_qty_lalu ?? 0),
    [data]
  );

  return (
    <aside
      className={`transition-all duration-300 ease-out border-l border-zinc-200 bg-white/95 backdrop-blur overflow-hidden
        ${open ? 'w-[440px]' : 'w-0'}`}
    >
      <div className="w-[440px] h-full overflow-y-auto custom-scroll">
        <div className="p-4 flex items-center justify-between sticky top-0 bg-white border-b border-zinc-100 z-10">
          <h3 className="text-sm font-bold text-zinc-800">Ringkasan AI</h3>
          <button
            type="button"
            onClick={() => toggle(false)}
            className="px-2 py-1 text-xs rounded hover:bg-zinc-100 text-zinc-500"
          >
            ✕ Tutup
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {isFetching && (
            <div className="text-xs text-zinc-500 animate-pulse">Memuat ringkasan…</div>
          )}
          {isError && (
            <button
              className="text-xs text-rose-600 underline self-start"
              onClick={() => refetch()}
            >
              Gagal memuat. Coba lagi.
            </button>
          )}

          {data && (
            <>
              <div className="rounded-xl border border-zinc-200 p-4">
                <div className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  Perbandingan Omset MoM
                </div>
                <div className="mt-1 text-lg font-bold text-zinc-800">
                  {formatRupiahShort(data.total_omset)}
                </div>
                <div className={`text-xs ${growthClass(totalGrowth)}`}>
                  {growthLabel(totalGrowth)} {growthVerb(totalGrowth)} vs bulan lalu (
                  {formatRupiahShort(data.total_omset_lalu)})
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 p-4">
                <div className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  Jumlah Produk Terjual
                </div>
                <div className="mt-1 text-lg font-bold text-zinc-800">
                  {formatAngka(data.total_qty)} Pcs
                </div>
                <div className={`text-xs ${growthClass(qtyGrowth)}`}>
                  {growthLabel(qtyGrowth)} vs {formatAngka(data.total_qty_lalu)} pcs bulan lalu
                </div>
              </div>

              {data.toko_top_growth && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase">
                    Top Growth Outlet
                  </div>
                  <div className="mt-1 font-semibold text-zinc-800">
                    {data.toko_top_growth.toko}
                  </div>
                  <div className="text-xs text-zinc-600">
                    {data.toko_top_growth.kanal} ·{' '}
                    {formatRupiahShort(data.toko_top_growth.omset_sekarang)}
                  </div>
                  <div className={`text-xs ${growthClass(data.toko_top_growth.growth ?? 0)}`}>
                    {growthLabel(data.toko_top_growth.growth ?? 0)}
                  </div>
                </div>
              )}

              {data.toko_bottom_growth && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                  <div className="text-[10px] font-bold tracking-wider text-rose-700 uppercase">
                    Butuh Perhatian
                  </div>
                  <div className="mt-1 font-semibold text-zinc-800">
                    {data.toko_bottom_growth.toko}
                  </div>
                  <div className="text-xs text-zinc-600">
                    {data.toko_bottom_growth.kanal} ·{' '}
                    {formatRupiahShort(data.toko_bottom_growth.omset_sekarang)}
                  </div>
                  <div className={`text-xs ${growthClass(data.toko_bottom_growth.growth ?? 0)}`}>
                    {growthLabel(data.toko_bottom_growth.growth ?? 0)}
                  </div>
                </div>
              )}

              {isAllKanal && data.per_kanal?.length > 0 && (
                <div className="rounded-xl border border-zinc-200 p-4">
                  <div className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase mb-2">
                    Breakdown per Kanal
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-zinc-500">
                        <th className="text-left font-medium pb-1">Kanal</th>
                        <th className="text-right font-medium pb-1">Omset</th>
                        <th className="text-right font-medium pb-1">Growth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.per_kanal.map((k) => {
                        const g = calcGrowth(k.omset_sekarang, k.omset_lalu);
                        return (
                          <tr key={k.kanal} className="border-t border-zinc-100">
                            <td className="py-1 text-zinc-700">{k.kanal}</td>
                            <td className="py-1 text-right font-mono text-zinc-800">
                              {formatRupiahShort(k.omset_sekarang)}
                            </td>
                            <td className={`py-1 text-right ${growthClass(g)}`}>
                              {growthLabel(g)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

export const SummaryDrawer = memo(SummaryDrawerImpl);
