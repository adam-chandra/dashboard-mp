import { memo, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ContribItem } from '../types';
import { formatRupiahShort } from '../lib/format';

interface Props {
  data: ContribItem[] | undefined;
  title: string;
  loading?: boolean;
}

const PALETTE = [
  '#2563eb', '#d97706', '#16a34a', '#9333ea', '#dc2626',
  '#0891b2', '#ca8a04', '#7c3aed', '#db2777', '#15803d',
  '#0284c7', '#ea580c',
];

function ContribChartImpl({ data, title, loading }: Props) {
  const option = useMemo(() => {
    const rows = (data ?? []).slice(0, 12);
    return {
      animationDuration: 400,
      tooltip: {
        trigger: 'item',
        formatter: (p: { name: string; value: number; percent: number }) =>
          `<div style="font-weight:600">${p.name}</div>
           <div>Omset: <b>${formatRupiahShort(p.value)}</b></div>
           <div>Kontribusi: <b>${p.percent.toFixed(1)}%</b></div>`,
      },
      legend: { type: 'scroll', orient: 'vertical', right: 10, top: 'middle', textStyle: { fontSize: 10 } },
      series: [
        {
          name: title,
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          labelLine: { show: false },
          data: rows.map((r, i) => ({
            name: r.label || 'Lainnya',
            value: r.omset || 0,
            itemStyle: { color: PALETTE[i % PALETTE.length] },
          })),
        },
      ],
    };
  }, [data, title]);

  return (
    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold tracking-wider text-zinc-700 uppercase">{title}</h3>
        {loading && <span className="text-xs text-zinc-400 animate-pulse">memuat…</span>}
      </div>
      <div style={{ height: 280 }}>
        <ReactECharts option={option} notMerge style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
      </div>
    </div>
  );
}

export const ContribChart = memo(ContribChartImpl);
