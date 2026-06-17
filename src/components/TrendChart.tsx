import { memo, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { GrafikItem } from '../types';
import { formatAngka } from '../lib/format';

interface Props {
  data: GrafikItem[] | undefined;
  loading?: boolean;
}

function TrendChartImpl({ data, loading }: Props) {
  const option = useMemo(() => {
    const rows = data ?? [];
    const axisNow: string[] = [];
    const axisPrev: string[] = [];
    const omsetNow: (number | null)[] = [];
    const omsetPrev: (number | null)[] = [];
    const qtyNow: (number | null)[] = [];
    const qtyPrev: (number | null)[] = [];

    for (const r of rows) {
      axisNow.push(r.sumbu_x ?? '');
      axisPrev.push(r.sumbu_x_lalu ?? '');
      omsetNow.push(r.periode_sekarang ?? null);
      omsetPrev.push(r.periode_sebelumnya ?? null);
      qtyNow.push(r.qty_sekarang ?? null);
      qtyPrev.push(r.qty_sebelumnya ?? null);
    }

    return {
      backgroundColor: 'transparent',
      animationDuration: 400,
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#e4e4e7',
        textStyle: { fontSize: 11 },
        formatter: (params: unknown) => {
          const arr = Array.isArray(params) ? (params as Array<{ dataIndex: number }>) : [];
          if (!arr.length) return '';
          const i = arr[0].dataIndex;
          const dot = (c: string) =>
            `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:6px;"></span>`;
          return `
            <div style="font-weight:600;margin-bottom:4px;">${axisNow[i] || '-'}</div>
            <div>${dot('#2563eb')}Omset Sekarang: <b>${formatAngka(omsetNow[i] ?? 0)}</b></div>
            <div>${dot('#d97706')}Qty Sekarang: <b>${formatAngka(qtyNow[i] ?? 0)}</b></div>
            <div style="border-top:1px dashed #e4e4e7;margin:6px 0;"></div>
            <div style="color:#71717a;font-size:10px;">Periode Lalu: ${axisPrev[i] || '-'}</div>
            <div>${dot('#93c5fd')}Omset Lalu: <b>${formatAngka(omsetPrev[i] ?? 0)}</b></div>
            <div>${dot('#fcd34d')}Qty Lalu: <b>${formatAngka(qtyPrev[i] ?? 0)}</b></div>
          `;
        },
      },
      legend: {
        show: true,
        bottom: 0,
        textStyle: { fontSize: 10, color: '#52525b' },
        itemWidth: 18,
        itemHeight: 8,
      },
      grid: { top: '8%', left: '5%', right: '5%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: axisNow,
        axisLabel: { color: '#9a9a9a', fontSize: 9, fontFamily: 'monospace' },
      },
      yAxis: [
        { type: 'value', name: 'Omset', axisLabel: { color: '#9a9a9a', fontSize: 9 } },
        { type: 'value', name: 'Qty', splitLine: { show: false }, axisLabel: { color: '#9a9a9a', fontSize: 9 } },
      ],
      series: [
        { name: 'Omset (Sekarang)', type: 'line', smooth: true, yAxisIndex: 0, showSymbol: false,
          lineStyle: { width: 2.5, color: '#2563eb' }, itemStyle: { color: '#2563eb' }, data: omsetNow },
        { name: 'Omset (Lalu)', type: 'line', smooth: true, yAxisIndex: 0, showSymbol: false,
          lineStyle: { width: 1.5, color: '#93c5fd', type: 'dashed' }, itemStyle: { color: '#93c5fd' }, data: omsetPrev },
        { name: 'Qty (Sekarang)', type: 'line', smooth: true, yAxisIndex: 1, showSymbol: false,
          lineStyle: { width: 2.5, color: '#d97706' }, itemStyle: { color: '#d97706' }, data: qtyNow },
        { name: 'Qty (Lalu)', type: 'line', smooth: true, yAxisIndex: 1, showSymbol: false,
          lineStyle: { width: 1.5, color: '#fcd34d', type: 'dashed' }, itemStyle: { color: '#fcd34d' }, data: qtyPrev },
      ],
    };
  }, [data]);

  return (
    <section className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-bold tracking-wider text-zinc-700 uppercase">Tren Periodik</h2>
        {loading && <span className="text-xs text-zinc-400 animate-pulse">memuat…</span>}
      </div>
      <div style={{ height: 360 }}>
        <ReactECharts option={option} notMerge style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
      </div>
    </section>
  );
}

export const TrendChart = memo(TrendChartImpl);
