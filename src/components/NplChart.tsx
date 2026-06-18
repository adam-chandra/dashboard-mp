import { memo, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { NPLSeries } from '../types';
import { formatRupiahShort } from '../lib/format';

interface Props {
  data: NPLSeries[] | undefined;
  loading?: boolean;
}

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const DAY_LABELS = ['Day-10', 'Day-20', 'Day-30', 'Day-40', 'Day-50', 'Day-60', 'Day-70', 'Day-80', 'Day-90'];
const DAY_VALUES = [10, 20, 30, 40, 50, 60, 70, 80, 90];

function interpolate(s: NPLSeries): number[] {
  const d30 = Number(s.day_30) || 0;
  const d60 = Number(s.day_60) || 0;
  const d90 = Number(s.day_90) || 0;
  const anchors = [
    { d: 0, v: 0 },
    { d: 30, v: d30 },
    { d: 60, v: d60 },
    { d: 90, v: d90 },
  ];
  return DAY_VALUES.map((d) => {
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i];
      const b = anchors[i + 1];
      if (d === a.d) return a.v;
      if (d === b.d) return b.v;
      if (d > a.d && d < b.d) {
        const t = (d - a.d) / (b.d - a.d);
        return a.v + t * (b.v - a.v);
      }
    }
    return 0;
  });
}

function NplChartImpl({ data, loading }: Props) {
  const series = useMemo(() => (data ?? []).filter((s) => s.found), [data]);
  const foundCount = series.length;

  const option = useMemo(() => {
    return {
      color: PALETTE,
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b', fontSize: 11 },
        formatter: (params: unknown) => {
          const arr = Array.isArray(params)
            ? (params as Array<{
                marker: string;
                seriesName: string;
                value: number;
                axisValueLabel: string;
              }>)
            : [];
          if (!arr.length) return '';
          const lines = arr.map(
            (p) => `${p.marker}<b>${p.seriesName}</b>: ${formatRupiahShort(p.value)}`
          );
          return `<b style="color:#475569">${arr[0].axisValueLabel}</b><br/>${lines.join('<br/>')}`;
        },
      },
      legend: {
        data: series.map((s) => s.kode),
        top: 0,
        left: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 10, color: '#475569', fontFamily: 'monospace' },
      },
      grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: DAY_LABELS,
        boundaryGap: false,
        axisLabel: { color: '#475569', fontSize: 11, fontWeight: 'bold' },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (v: number) => formatRupiahShort(v) },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: series.map((s, i) => ({
        name: s.kode,
        type: 'line',
        smooth: true,
        symbol: (_value: unknown, params: { dataIndex: number }) => {
          const d = DAY_VALUES[params.dataIndex];
          return d === 30 || d === 60 || d === 90 ? 'circle' : 'none';
        },
        symbolSize: 8,
        showSymbol: true,
        lineStyle: { width: 2.5, color: PALETTE[i % PALETTE.length] },
        itemStyle: { color: PALETTE[i % PALETTE.length], borderColor: '#fff', borderWidth: 2 },
        areaStyle: { opacity: 0.08, color: PALETTE[i % PALETTE.length] },
        emphasis: { focus: 'series', lineStyle: { width: 3.5 } },
        data: interpolate(s),
      })),
    };
  }, [series]);

  return (
    <section className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-xs font-bold tracking-widest text-zinc-700 uppercase border-l-2 border-emerald-500 pl-2">
            NPL Tracker
          </h2>
          <p className="text-[10px] font-mono text-zinc-400 mt-1 pl-2">
            Akumulasi penjualan produk pada D30 / D60 / D90
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
          {foundCount} TRACKED
        </span>
      </div>

      <div style={{ height: 260 }} className="flex-1">
        {loading && series.length === 0 ? (
          <div className="h-full w-full rounded-lg bg-zinc-50 animate-pulse" />
        ) : series.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400 italic border border-dashed border-zinc-200 rounded-lg">
            Tidak ada produk NPL pada periode aktif.
          </div>
        ) : (
          <ReactECharts
            option={option}
            notMerge
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        )}
      </div>
    </section>
  );
}

export const NplChart = memo(NplChartImpl);
