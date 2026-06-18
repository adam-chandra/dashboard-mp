import { memo, useMemo } from 'react';
import { useDashboardStore } from '../store/dashboard';
import {
  calcGrowth,
  formatAngka,
  formatRupiahShort,
  growthClass,
  growthLabel,
  growthVerb,
} from '../lib/format';

function SummaryDrawerImpl() {
  const open = useDashboardStore((s) => s.summaryOpen);
  const loading = useDashboardStore((s) => s.summaryLoading);
  const error = useDashboardStore((s) => s.summaryError);
  const data = useDashboardStore((s) => s.summaryData);
  const toggle = useDashboardStore((s) => s.toggleSummary);
  const openSummary = useDashboardStore((s) => s.openSummary);

  const totalGrowth = useMemo(
    () => calcGrowth(data?.omset.sekarang ?? 0, data?.omset.lalu ?? 0),
    [data]
  );
  const qtyGrowth = useMemo(
    () => calcGrowth(data?.qty.sekarang ?? 0, data?.qty.lalu ?? 0),
    [data]
  );
  const showKanal = useMemo(() => (data?.per_kanal?.length ?? 0) > 0, [data]);

  return (
    <aside
      className={`transition-all duration-300 ease-out border-l border-zinc-200 bg-white/95 backdrop-blur overflow-hidden
        ${open ? 'w-[440px]' : 'w-0'}`}
    >
      <div className="w-[440px] h-full overflow-y-auto custom-scroll">
        <div className="p-4 flex items-center justify-between sticky top-0 bg-white border-b border-zinc-100 z-10">
          <div>
            <h3 className="text-sm font-bold text-zinc-800">Ringkasan AI</h3>
            {data?.scope && (
              <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Scope: <b className="text-zinc-600">{data.scope}</b>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => toggle(false)}
            className="px-2 py-1 text-xs rounded hover:bg-zinc-100 text-zinc-500"
          >
            ✕ Tutup
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {loading && (
            <div className="text-xs text-zinc-500 animate-pulse">Memuat ringkasan…</div>
          )}
          {error && !loading && (
            <button
              className="text-xs text-rose-600 underline self-start"
              onClick={() => void openSummary()}
            >
              {error}. Coba lagi.
            </button>
          )}

          {data && (
            <>
              <div className="rounded-xl border border-zinc-200 p-4">
                <div className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  Perbandingan Omset MoM
                </div>
                <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  {data.periode_sekarang} <span className="text-zinc-300">vs</span>{' '}
                  {data.periode_lalu}
                </div>
                <div className="mt-1 text-lg font-bold text-zinc-800">
                  {formatRupiahShort(data.omset.sekarang)}
                </div>
                <div className={`text-xs ${growthClass(totalGrowth)}`}>
                  {growthLabel(totalGrowth)} {growthVerb(totalGrowth)} vs periode lalu (
                  {formatRupiahShort(data.omset.lalu)})
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 p-4">
                <div className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  Jumlah Produk Terjual
                </div>
                <div className="mt-1 text-lg font-bold text-zinc-800">
                  {formatAngka(data.qty.sekarang)} Pcs
                </div>
                <div className={`text-xs ${growthClass(qtyGrowth)}`}>
                  {growthLabel(qtyGrowth)} vs {formatAngka(data.qty.lalu)} pcs periode lalu
                </div>
              </div>

              {data.toko_top_growth && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <div className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase">
                    Top Growth Outlet
                  </div>
                  <div className="mt-1 font-semibold text-zinc-800">
                    {data.toko_top_growth.nama_toko}
                  </div>
                  <div className="text-xs text-zinc-600">
                    {data.toko_top_growth.kanal} ·{' '}
                    {formatRupiahShort(data.toko_top_growth.omset_sekarang)}
                  </div>
                  <div
                    className={`text-xs ${growthClass(
                      calcGrowth(
                        data.toko_top_growth.omset_sekarang,
                        data.toko_top_growth.omset_lalu
                      )
                    )}`}
                  >
                    {growthLabel(
                      calcGrowth(
                        data.toko_top_growth.omset_sekarang,
                        data.toko_top_growth.omset_lalu
                      )
                    )}
                  </div>
                </div>
              )}

              {data.toko_bottom_growth && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                  <div className="text-[10px] font-bold tracking-wider text-rose-700 uppercase">
                    Butuh Perhatian
                  </div>
                  <div className="mt-1 font-semibold text-zinc-800">
                    {data.toko_bottom_growth.nama_toko}
                  </div>
                  <div className="text-xs text-zinc-600">
                    {data.toko_bottom_growth.kanal} ·{' '}
                    {formatRupiahShort(data.toko_bottom_growth.omset_sekarang)}
                  </div>
                  <div
                    className={`text-xs ${growthClass(
                      calcGrowth(
                        data.toko_bottom_growth.omset_sekarang,
                        data.toko_bottom_growth.omset_lalu
                      )
                    )}`}
                  >
                    {growthLabel(
                      calcGrowth(
                        data.toko_bottom_growth.omset_sekarang,
                        data.toko_bottom_growth.omset_lalu
                      )
                    )}
                  </div>
                </div>
              )}

              {showKanal && (
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
