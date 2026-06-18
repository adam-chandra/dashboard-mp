import { memo, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { GrafikItem } from '../types';
import { formatAngka, formatRupiahShort } from '../lib/format';

export type TrendGroup = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface Props {
  rows: GrafikItem[];
  group: TrendGroup;
  onGroupChange: (next: TrendGroup) => void;
  loading?: boolean;
  prevDateText?: string;
}

const MONTH_ABBR_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function parseISO(d: string | undefined): Date | null {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function bucketKey(dateStr: string | undefined, group: TrendGroup): string {
  const d = parseISO(dateStr);
  if (!d) return '';
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  if (group === 'monthly') return `${y}-${String(m).padStart(2, '0')}`;
  if (group === 'quarterly') return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
  if (group === 'yearly') return `${y}`;
  if (group === 'weekly') {
    const tmp = new Date(Date.UTC(y, d.getMonth(), d.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      (((tmp.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7
    );
    return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }
  return dateStr ?? '';
}

function formatLabel(dateStr: string | undefined, group: TrendGroup): string {
  const d = parseISO(dateStr);
  if (!d) return dateStr ?? '-';
  const y = d.getFullYear();
  const m = d.getMonth();
  if (group === 'daily') return `${d.getDate()} ${MONTH_ABBR_ID[m]} ${y}`;
  if (group === 'monthly') return `${MONTH_ABBR_ID[m]} ${y}`;
  if (group === 'quarterly') return `Q${Math.floor(m / 3) + 1} ${y}`;
  if (group === 'yearly') return `${y}`;
  if (group === 'weekly') {
    const tmp = new Date(Date.UTC(y, m, d.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      (((tmp.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7
    );
    return `W${weekNo} ${tmp.getUTCFullYear()}`;
  }
  return dateStr ?? '-';
}

interface GroupRow {
  sortKey: string;
  label: string;
  label_prev: string;
  periode_sekarang: number;
  periode_sebelumnya: number;
  qty_sekarang: number;
  qty_sebelumnya: number;
}

function aggregateRows(rows: GrafikItem[], group: TrendGroup): GroupRow[] {
  if (!rows.length) return [];
  if (group === 'daily') {
    return rows.map((r) => ({
      sortKey: r.sumbu_x ?? '',
      label: formatLabel(r.sumbu_x, 'daily'),
      label_prev: formatLabel(r.sumbu_x_lalu, 'daily'),
      periode_sekarang: Number(r.periode_sekarang) || 0,
      periode_sebelumnya: Number(r.periode_sebelumnya) || 0,
      qty_sekarang: Number(r.qty_sekarang) || 0,
      qty_sebelumnya: Number(r.qty_sebelumnya) || 0,
    }));
  }
  const buckets = new Map<string, GroupRow>();
  for (const r of rows) {
    const key = bucketKey(r.sumbu_x, group);
    if (!key) continue;
    let b = buckets.get(key);
    if (!b) {
      b = {
        sortKey: key,
        label: formatLabel(r.sumbu_x, group),
        label_prev: formatLabel(r.sumbu_x_lalu, group),
        periode_sekarang: 0,
        periode_sebelumnya: 0,
        qty_sekarang: 0,
        qty_sebelumnya: 0,
      };
      buckets.set(key, b);
    }
    b.periode_sekarang += Number(r.periode_sekarang) || 0;
    b.periode_sebelumnya += Number(r.periode_sebelumnya) || 0;
    b.qty_sekarang += Number(r.qty_sekarang) || 0;
    b.qty_sebelumnya += Number(r.qty_sebelumnya) || 0;
  }
  return Array.from(buckets.values()).sort((a, b) =>
    a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0
  );
}

function growthPct(curr: number, prev: number): {
  txt: string;
  color: string;
} {
  if (!prev || prev === 0) return { txt: '0%', color: '#a1a1aa' };
  const pct = ((curr - prev) / prev) * 100;
  const arrow = pct >= 0 ? '▲' : '▼';
  const color = pct >= 0 ? '#10b981' : '#e11d48';
  return { txt: `${arrow} ${Math.abs(pct).toFixed(1)}%`, color };
}

function TrendChartImpl({ rows, group, onGroupChange, loading, prevDateText }: Props) {
  const grouped = useMemo(() => aggregateRows(rows, group), [rows, group]);

  const totals = useMemo(() => {
    let omsetNow = 0,
      omsetPrev = 0,
      qtyNow = 0,
      qtyPrev = 0;
    for (const r of grouped) {
      omsetNow += r.periode_sekarang;
      omsetPrev += r.periode_sebelumnya;
      qtyNow += r.qty_sekarang;
      qtyPrev += r.qty_sebelumnya;
    }
    return { omsetNow, omsetPrev, qtyNow, qtyPrev };
  }, [grouped]);

  const option = useMemo(() => {
    const cats = grouped.map((g) => g.label || '');
    return {
      backgroundColor: 'transparent',
      animationDuration: 300,
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#e4e4e7',
        textStyle: { color: '#27272a', fontSize: 11 },
        formatter: (params: unknown) => {
          const arr = Array.isArray(params) ? (params as Array<{ dataIndex: number }>) : [];
          if (!arr.length) return '';
          const i = arr[0].dataIndex;
          const row = grouped[i];
          if (!row) return '';
          const gO = growthPct(row.periode_sekarang, row.periode_sebelumnya);
          const gQ = growthPct(row.qty_sekarang, row.qty_sebelumnya);
          const fmtR = (v: number) => formatRupiahShort(v);
          const fmtN = (v: number) => formatAngka(v);
          return `
            <div style="font-family: ui-monospace, monospace; font-size: 11px; min-width: 240px; line-height: 1.5;">
              <div style="font-weight:700; color:#2563eb; border-bottom:1px solid #e4e4e7; padding-bottom:3px; margin-bottom:4px;">CURRENT •• ${row.label}</div>
              <div style="display:flex; justify-content:space-between;"><span>Omset</span><b>${fmtR(row.periode_sekarang)}</b></div>
              <div style="display:flex; justify-content:space-between;"><span>Qty</span><b>${fmtN(row.qty_sekarang)} Pcs</b></div>
              <div style="font-weight:700; color:#94a3b8; border-bottom:1px dashed #e4e4e7; padding-bottom:3px; margin:6px 0 4px;">PREVIOUS •• ${row.label_prev}</div>
              <div style="display:flex; justify-content:space-between; color:#71717a;"><span>Omset</span><b>${fmtR(row.periode_sebelumnya)}</b></div>
              <div style="display:flex; justify-content:space-between; color:#71717a;"><span>Qty</span><b>${fmtN(row.qty_sebelumnya)} Pcs</b></div>
              <div style="border-top:1px solid #e4e4e7; margin-top:6px; padding-top:4px;">
                <div style="display:flex; justify-content:space-between;"><span>Growth Omset</span><b style="color:${gO.color}">${gO.txt}</b></div>
                <div style="display:flex; justify-content:space-between;"><span>Growth Qty</span><b style="color:${gQ.color}">${gQ.txt}</b></div>
              </div>
            </div>`;
        },
      },
      legend: {
        textStyle: { color: '#71717a', fontSize: 10, fontWeight: 'bold' },
        bottom: 0,
        data: ['Current Omset', 'Current Qty', 'Previous Omset', 'Previous Qty'],
      },
      grid: { top: '12%', left: '6%', right: '6%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: cats,
        axisLabel: { color: '#9a9a9a', fontSize: 9, fontFamily: 'monospace' },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Omset (IDR)',
          axisLabel: { color: '#9a9a9a', fontSize: 9 },
        },
        {
          type: 'value',
          name: 'Qty (Pcs)',
          splitLine: { show: false },
          axisLabel: { color: '#9a9a9a', fontSize: 9 },
        },
      ],
      series: [
        {
          name: 'Current Omset',
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          lineStyle: { width: 3, type: 'solid' },
          itemStyle: { color: '#2563eb' },
          data: grouped.map((i) => i.periode_sekarang || 0),
        },
        {
          name: 'Current Qty',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          lineStyle: { width: 3, type: 'solid' },
          itemStyle: { color: '#d97706' },
          data: grouped.map((i) => i.qty_sekarang || 0),
        },
        {
          name: 'Previous Omset',
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          lineStyle: { width: 2, type: 'dashed' },
          itemStyle: { color: '#94a3b8' },
          data: grouped.map((i) => i.periode_sebelumnya || 0),
        },
        {
          name: 'Previous Qty',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          lineStyle: { width: 2, type: 'dashed' },
          itemStyle: { color: '#fdba74' },
          data: grouped.map((i) => i.qty_sebelumnya || 0),
        },
      ],
    };
  }, [grouped]);

  return (
    <section className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="text-xs font-bold tracking-widest text-zinc-700 uppercase border-l-2 border-indigo-500 pl-2">
            Trend Analysis
          </h2>
          {prevDateText && (
            <p className="text-[10px] font-mono text-zinc-400 mt-1 pl-2">
              Periode dibandingkan: {prevDateText}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
            Group
          </label>
          <select
            value={group}
            onChange={(e) => onGroupChange(e.target.value as TrendGroup)}
            className="text-xs h-8 px-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div style={{ height: 320 }}>
        {loading && grouped.length === 0 ? (
          <div className="h-full w-full rounded-lg bg-zinc-50 animate-pulse" />
        ) : (
          <ReactECharts
            option={option}
            notMerge
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-zinc-100">
        <SummaryStat label="Omset Lalu" value={formatRupiahShort(totals.omsetPrev)} tone="muted" />
        <SummaryStat label="Omset Sekarang" value={formatRupiahShort(totals.omsetNow)} tone="primary" />
        <SummaryStat label="Qty Lalu" value={`${formatAngka(totals.qtyPrev)} Pcs`} tone="muted" />
        <SummaryStat label="Qty Sekarang" value={`${formatAngka(totals.qtyNow)} Pcs`} tone="amber" />
      </div>
    </section>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'muted' | 'primary' | 'amber';
}) {
  const color =
    tone === 'primary'
      ? 'text-blue-700'
      : tone === 'amber'
        ? 'text-amber-700'
        : 'text-zinc-500';
  return (
    <div>
      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{label}</div>
      <div className={`text-sm font-black font-mono tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

export const TrendChart = memo(TrendChartImpl);
