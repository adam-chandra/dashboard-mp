import { memo, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ContribItem } from '../types';
import { formatRupiahShort } from '../lib/format';

export const CONTRIB_PALETTE = [
  '#4f46e5', '#0ea5e9', '#1e293b', '#7c3aed', '#06b6d4',
  '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b',
];

interface Props {
  data: ContribItem[] | undefined;
  title: string;
  loading?: boolean;
}

function ContribChartImpl({ data, title, loading }: Props) {
  const rows = useMemo(() => (data ?? []).slice(0, 12), [data]);
  const total = useMemo(
    () => rows.reduce((s, x) => s + (Number(x.omset) || 0), 0),
    [rows]
  );

  const option = useMemo(() => {
    return {
      animationDuration: 400,
      tooltip: {
        trigger: 'item',
        formatter: (p: { name: string; value: number }) => {
          const pct = total > 0 ? (p.value / total) * 100 : 0;
          return `<b>${p.name}</b><br/>${formatRupiahShort(p.value)}<br/>${pct.toFixed(1)}% kontribusi`;
        },
        textStyle: { fontSize: 11 },
      },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'middle',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11, color: '#52525b' },
      },
      series: [
        {
          name: title,
          type: 'pie',
          radius: ['52%', '78%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          labelLine: { show: false },
          data: rows.map((r, i) => ({
            name: r.label || 'Lainnya',
            value: Number(r.omset) || 0,
            itemStyle: { color: CONTRIB_PALETTE[i % CONTRIB_PALETTE.length] },
          })),
        },
      ],
    };
  }, [rows, total, title]);

  return (
    <div className="flex flex-col">
      <div style={{ height: 260 }}>
        {loading && rows.length === 0 ? (
          <div className="h-full w-full rounded-lg bg-zinc-50 animate-pulse" />
        ) : rows.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400 italic border border-dashed border-zinc-200 rounded-lg">
            Tidak ada data.
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
    </div>
  );
}

export const ContribChart = memo(ContribChartImpl);
