import { useMemo, useState } from 'react';
import { useDashboardStore } from '../store/dashboard';
import { HeaderAnalytics } from '../components/HeaderAnalytics';
import { KpiCards } from '../components/KpiCards';
import { TrendChart, type TrendGroup } from '../components/TrendChart';
import { ContribChart, CONTRIB_PALETTE } from '../components/ContribChart';
import { OutletLeaderboard } from '../components/OutletLeaderboard';
import { HeroProducts } from '../components/HeroProducts';
import { NplChart } from '../components/NplChart';
import { ProductLeaderboard } from '../components/ProductLeaderboard';
import { RegionMap } from '../components/RegionMap';
import { formatRupiahShort } from '../lib/format';

type ContribDim = 'brand' | 'kanal' | 'kategori';
const CONTRIB_DIMS: { key: ContribDim; label: string }[] = [
  { key: 'brand', label: 'Brand' },
  { key: 'kanal', label: 'Kanal' },
  { key: 'kategori', label: 'Channel' },
];

export default function Dashboard() {
  const metrik = useDashboardStore((s) => s.metrik);
  const grafikDataRaw = useDashboardStore((s) => s.grafikDataRaw);
  const trendOverride = useDashboardStore((s) => s.trendOverride);
  const peringkat = useDashboardStore((s) => s.peringkat);
  const salesPerf = useDashboardStore((s) => s.salesPerformance);
  const dashboardReady = useDashboardStore((s) => s.dashboardReady);
  const prevDateText = useDashboardStore((s) => s.prevDateText);
  const setTrendOverrideMode = useDashboardStore((s) => s.setTrendOverrideMode);

  const [trendGroup, setTrendGroup] = useState<TrendGroup>('daily');
  const [activeDim, setActiveDim] = useState<ContribDim>('brand');

  const handleGroupChange = (next: TrendGroup) => {
    setTrendGroup(next);
    const overrideMode = next === 'monthly' || next === 'quarterly' || next === 'yearly' ? next : '';
    void setTrendOverrideMode(overrideMode);
  };

  const trendRows = useMemo(() => {
    if (trendGroup === 'monthly' || trendGroup === 'quarterly' || trendGroup === 'yearly') {
      return trendOverride;
    }
    return grafikDataRaw;
  }, [trendGroup, trendOverride, grafikDataRaw]);

  const contribRows = useMemo(() => {
    if (!salesPerf) return [];
    if (activeDim === 'brand') return salesPerf.contrib_by_brand ?? [];
    if (activeDim === 'kanal') return salesPerf.contrib_by_kanal ?? [];
    return salesPerf.contrib_by_kategori ?? [];
  }, [salesPerf, activeDim]);

  const contribTotal = useMemo(
    () => contribRows.reduce((s, x) => s + (Number(x.omset) || 0), 0),
    [contribRows]
  );

  const topContrib = useMemo(() => contribRows.slice(0, 8), [contribRows]);

  const loading = !dashboardReady;

  return (
    <div className="flex flex-col gap-5">
      <HeaderAnalytics title="EXECUTIVE PERFORMANCE ANALYTICS" />

      <KpiCards data={metrik} loading={loading} />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <TrendChart
            rows={trendRows}
            group={trendGroup}
            onGroupChange={handleGroupChange}
            loading={loading}
            prevDateText={prevDateText}
          />
        </div>

        <section className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold tracking-widest text-zinc-700 uppercase border-l-2 border-purple-500 pl-2">
              Contribution Breakdown
            </h2>
            <div className="inline-flex bg-zinc-100 border border-zinc-200 rounded-lg p-0.5 gap-0.5">
              {CONTRIB_DIMS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setActiveDim(d.key)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition ${
                    activeDim === d.key
                      ? 'bg-zinc-900 text-white shadow'
                      : 'text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <ContribChart
            data={contribRows}
            title={`Kontribusi per ${activeDim}`}
            loading={loading}
          />

          <div className="mt-2 pt-3 border-t border-zinc-100">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-2">
              Top Contributors
            </div>
            <ul className="flex flex-col gap-1.5 max-h-56 overflow-y-auto custom-scroll pr-1">
              {topContrib.length === 0 && (
                <li className="text-[11px] italic text-zinc-400">Belum ada data.</li>
              )}
              {topContrib.map((c, i) => {
                const pct = contribTotal > 0 ? ((c.omset ?? 0) / contribTotal) * 100 : 0;
                return (
                  <li key={`${c.label}-${i}`} className="flex items-center gap-2 text-[11px]">
                    <span
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ background: CONTRIB_PALETTE[i % CONTRIB_PALETTE.length] }}
                    />
                    <span className="text-zinc-700 font-medium truncate flex-1">
                      {c.label || 'Lainnya'}
                    </span>
                    <span className="font-mono font-bold text-zinc-800 tabular-nums">
                      {formatRupiahShort(c.omset)}
                    </span>
                    <span className="font-mono text-zinc-400 tabular-nums w-12 text-right">
                      {pct.toFixed(1)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </section>

      <OutletLeaderboard data={peringkat} loading={loading} />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <HeroProducts data={salesPerf?.hero_products} loading={loading} />
        <NplChart data={salesPerf?.npl_series} loading={loading} />
      </section>

      <ProductLeaderboard data={salesPerf?.leaderboard} loading={loading} />

      <RegionMap
        topProvinsi={salesPerf?.top_provinsi ?? []}
        topKota={salesPerf?.top_kota ?? []}
        provinsiMappingStats={salesPerf?.provinsi_mapping_stats}
        loading={loading}
      />
    </div>
  );
}
