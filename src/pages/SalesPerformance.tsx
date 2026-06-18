import { memo, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { HeaderAnalytics } from '../components/HeaderAnalytics';
import { useDashboardStore } from '../store/dashboard';
import type { LogistikItem } from '../types';
import { formatRupiahShort } from '../lib/format';

const STATUS_ORDER = ['Success', 'On Progress', 'Pending', 'Cancelled', 'Return'] as const;
type Status = typeof STATUS_ORDER[number] | 'Unknown';
const STATUS_COLORS: Record<Status, string> = {
  Success: '#10b981',
  'On Progress': '#6366f1',
  Pending: '#f59e0b',
  Cancelled: '#94a3b8',
  Return: '#ef4444',
  Unknown: '#cbd5e1',
};

const RE_SUCCESS = /(success|delivered|completed|selesai|terkirim|done)/;
const RE_RETURN = /(return|retur|rts|refund)/;
const RE_CANCEL = /(cancel|batal|void)/;
const RE_PENDING = /(pending|menunggu|hold|wait)/;
const RE_PROGRESS = /(progress|process|proses|shipping|dikirim|packed|ready)/;

function classifyStatus(raw: string | undefined): Status {
  const s = String(raw || '').toLowerCase().trim();
  if (!s || s === '-' || s === 'n/a' || s === 'null') return 'Unknown';
  if (RE_SUCCESS.test(s)) return 'Success';
  if (RE_RETURN.test(s)) return 'Return';
  if (RE_CANCEL.test(s)) return 'Cancelled';
  if (RE_PENDING.test(s)) return 'Pending';
  if (RE_PROGRESS.test(s)) return 'On Progress';
  return 'Unknown';
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

type PeriodGroup = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type ReturnBasis = 'gmv' | 'orders';

function bucketDate(dateStr: string, group: PeriodGroup): string {
  if (!dateStr) return dateStr;
  if (group === 'daily') return dateStr;
  const d = new Date(dateStr + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return dateStr;
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  if (group === 'monthly') return `${y}-${String(m).padStart(2, '0')}`;
  if (group === 'quarterly') return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
  if (group === 'yearly') return `${y}`;
  if (group === 'weekly') {
    const tmp = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      (((tmp.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7
    );
    return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }
  return dateStr;
}

interface NormRow {
  kanal: string;
  order: string;
  tanggal: string;
  omzet: number;
  status: Status;
  statusFix: string;
  status3pl: string;
  statusWms: string;
  stdReturn: string;
}

function normalizeRows(rows: LogistikItem[]): NormRow[] {
  const out: NormRow[] = new Array(rows.length);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const kanal = (r?.kanal || '').trim();
    const order = (r?.order_number || '').trim();
    out[i] = {
      kanal: !kanal || kanal === 'Unknown Kanal' ? '' : kanal,
      order: !order || order === '-' ? '' : order,
      tanggal: (r?.tanggal || '').trim(),
      omzet: Number(r?.omzet) || 0,
      status: classifyStatus(r?.status_fix),
      statusFix: r?.status_fix ?? '',
      status3pl: r?.status_3pl ?? '',
      statusWms: r?.status_wms ?? '',
      stdReturn: r?.std_return ?? '',
    };
  }
  return out;
}

function badgeTone(label: string): { bg: string; dot: string; text: string } {
  const u = label.toLowerCase();
  if (RE_SUCCESS.test(u)) return { bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700' };
  if (RE_RETURN.test(u)) return { bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500', text: 'text-rose-700' };
  if (RE_CANCEL.test(u)) return { bg: 'bg-zinc-50 border-zinc-200', dot: 'bg-zinc-400', text: 'text-zinc-600' };
  if (RE_PENDING.test(u)) return { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700' };
  if (RE_PROGRESS.test(u)) return { bg: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500', text: 'text-indigo-700' };
  return { bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400', text: 'text-slate-700' };
}

function SalesPerformanceImpl() {
  const logistik = useDashboardStore((s) => s.logistik);
  const dashboardReady = useDashboardStore((s) => s.dashboardReady);
  const loading = !dashboardReady;

  const [returnBasis, setReturnBasis] = useState<ReturnBasis>('gmv');
  const [periodGroup, setPeriodGroup] = useState<PeriodGroup>('daily');

  const rows = useMemo(() => normalizeRows(logistik), [logistik]);

  const statusBadgeCards = useMemo(() => {
    const cards: { key: 'statusFix' | 'status3pl' | 'statusWms'; title: string; color: string }[] = [
      { key: 'statusFix', title: 'Status Standard', color: '#0ea5e9' },
      { key: 'status3pl', title: 'Status Toko', color: '#7c3aed' },
      { key: 'statusWms', title: 'Status WMS', color: '#2563eb' },
    ];
    const counters: Record<string, Map<string, number>> = {
      statusFix: new Map(),
      status3pl: new Map(),
      statusWms: new Map(),
    };
    for (const r of rows) {
      for (const c of cards) {
        let v = String(r[c.key] ?? '').trim();
        if (!v || v === '-' || /^null$/i.test(v) || /^unknown/i.test(v)) v = 'N/A';
        counters[c.key].set(v, (counters[c.key].get(v) || 0) + 1);
      }
    }
    return cards.map((c) => {
      const counter = counters[c.key];
      const total = Array.from(counter.values()).reduce((s, n) => s + n, 0) || 1;
      const badges = Array.from(counter.entries())
        .map(([label, count]) => ({ label, count, pct: (count / total) * 100 }))
        .sort((a, b) => b.count - a.count);
      return { ...c, badges };
    });
  }, [rows]);

  const orderStackedAgg = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    const seen: Record<string, Set<string>> = {};
    for (const r of rows) {
      if (!r.kanal || r.status === 'Unknown' || !r.order) continue;
      const key = `${r.order}|${r.status}`;
      if (!matrix[r.kanal]) {
        matrix[r.kanal] = {};
        seen[r.kanal] = new Set();
      }
      if (seen[r.kanal].has(key)) continue;
      seen[r.kanal].add(key);
      matrix[r.kanal][r.status] = (matrix[r.kanal][r.status] || 0) + 1;
    }
    const kanals = Object.keys(matrix).sort();
    return { kanals, matrix };
  }, [rows]);

  const orderStackedOption = useMemo(() => {
    const { kanals, matrix } = orderStackedAgg;
    const totals = kanals.map(
      (k) => STATUS_ORDER.reduce((s, st) => s + (matrix[k]?.[st] || 0), 0) || 1
    );
    const series = STATUS_ORDER.map((status) => ({
      name: status,
      type: 'bar',
      stack: 'total',
      emphasis: { focus: 'series' },
      itemStyle: { color: STATUS_COLORS[status], borderRadius: 0 },
      barMaxWidth: 40,
      data: kanals.map((k, i) =>
        +(((matrix[k]?.[status] || 0) / totals[i]) * 100).toFixed(2)
      ),
    }));
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b', fontSize: 11 },
        formatter: (params: unknown) => {
          const arr = Array.isArray(params)
            ? (params as Array<{ marker: string; seriesName: string; value: number; axisValueLabel: string }>)
            : [];
          if (!arr.length) return '';
          const kanal = arr[0].axisValueLabel;
          const total = totals[kanals.indexOf(kanal)];
          const lines = arr.map(
            (p) =>
              `${p.marker}<b>${p.seriesName}</b>: ${p.value}% (${matrix[kanal]?.[p.seriesName] || 0})`
          );
          return `<b style="color:#475569">${kanal}</b> · <span style="font-family:monospace;color:#64748b">${total} orders</span><br/>${lines.join('<br/>')}`;
        },
      },
      legend: {
        data: STATUS_ORDER as unknown as string[],
        top: 0,
        itemWidth: 12,
        itemHeight: 8,
        textStyle: { fontSize: 10, color: '#475569', fontFamily: 'monospace' },
      },
      grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: kanals,
        axisLabel: {
          color: '#475569',
          fontSize: 10,
          fontWeight: 'bold',
          interval: 0,
          rotate: kanals.length > 5 ? 25 : 0,
        },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series,
    };
  }, [orderStackedAgg]);

  const returnReasonRows = useMemo(() => {
    const counter = new Map<string, number>();
    for (const r of rows) {
      const reason = String(r.stdReturn || '').trim();
      if (!reason || reason === '-' || /^null$/i.test(reason) || /^unknown/i.test(reason)) continue;
      counter.set(reason, (counter.get(reason) || 0) + 1);
    }
    return Array.from(counter.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [rows]);

  const returnReasonOption = useMemo(() => {
    const rs = returnReasonRows;
    const colorAt = (i: number) => {
      const pct = rs.length > 1 ? 1 - i / (rs.length - 1) : 1;
      const a = [254, 226, 226];
      const b = [190, 18, 60];
      const mix = (idx: number) => Math.round(a[idx] + (b[idx] - a[idx]) * pct);
      return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
    };
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#ffffff',
        borderColor: '#fecdd3',
        textStyle: { color: '#881337', fontSize: 11 },
        formatter: (p: unknown) => {
          const arr = Array.isArray(p)
            ? (p as Array<{ name: string; value: number; marker: string }>)
            : [];
          return arr[0]
            ? `<b>${arr[0].name}</b><br/>${arr[0].marker} Kasus: <b>${arr[0].value}</b>`
            : '';
        },
      },
      grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: rs.map((r) => r.label).reverse(),
        axisLabel: { color: '#334155', fontSize: 10, fontWeight: 'bold' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: rs
            .slice()
            .reverse()
            .map((r, i) => ({
              value: r.count,
              itemStyle: { color: colorAt(rs.length - 1 - i), borderRadius: [0, 6, 6, 0] },
            })),
          barMaxWidth: 18,
          label: {
            show: true,
            position: 'right',
            color: '#be123c',
            fontSize: 10,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            formatter: '{c}',
          },
        },
      ],
    };
  }, [returnReasonRows]);

  const returnAgg = useMemo(() => {
    const plat: Record<string, { gmv: number; returnGmv: number; orders: number; returnOrders: number }> = {};
    const platSeen: Record<string, { all: Set<string>; ret: Set<string> }> = {};
    const per: Record<string, { gmv: number; returnGmv: number; orders: number; returnOrders: number }> = {};
    const perSeen: Record<string, { all: Set<string>; ret: Set<string> }> = {};
    for (const r of rows) {
      if (!r.kanal) continue;
      const isRet = r.status === 'Return';
      if (!plat[r.kanal]) {
        plat[r.kanal] = { gmv: 0, returnGmv: 0, orders: 0, returnOrders: 0 };
        platSeen[r.kanal] = { all: new Set(), ret: new Set() };
      }
      plat[r.kanal].gmv += r.omzet;
      if (isRet) plat[r.kanal].returnGmv += r.omzet;
      if (r.order) {
        platSeen[r.kanal].all.add(r.order);
        if (isRet) platSeen[r.kanal].ret.add(r.order);
      }
      if (!r.tanggal) continue;
      const t = bucketDate(r.tanggal, periodGroup);
      if (!per[t]) {
        per[t] = { gmv: 0, returnGmv: 0, orders: 0, returnOrders: 0 };
        perSeen[t] = { all: new Set(), ret: new Set() };
      }
      per[t].gmv += r.omzet;
      if (isRet) per[t].returnGmv += r.omzet;
      if (r.order) {
        perSeen[t].all.add(r.order);
        if (isRet) perSeen[t].ret.add(r.order);
      }
    }
    for (const k of Object.keys(plat)) {
      plat[k].orders = platSeen[k].all.size;
      plat[k].returnOrders = platSeen[k].ret.size;
    }
    const dates = Object.keys(per).sort();
    for (const d of dates) {
      per[d].orders = perSeen[d].all.size;
      per[d].returnOrders = perSeen[d].ret.size;
    }
    return { platform: plat, periodAgg: per, periodDates: dates };
  }, [rows, periodGroup]);

  const comboPlatformOption = useMemo(() => {
    const agg = returnAgg.platform;
    const kanals = Object.keys(agg).sort();
    const isGmv = returnBasis === 'gmv';
    const volume = kanals.map((k) => (isGmv ? agg[k].gmv : agg[k].orders));
    const retVol = kanals.map((k) => (isGmv ? agg[k].returnGmv : agg[k].returnOrders));
    const retPct = kanals.map((_k, i) => +((retVol[i] / (volume[i] || 1)) * 100).toFixed(2));
    const formatVol = isGmv
      ? (v: number) => formatRupiahShort(v)
      : (v: number) => Number(v).toLocaleString('id-ID');
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', crossStyle: { color: '#cbd5e1' } },
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b', fontSize: 11 },
        formatter: (params: unknown) => {
          const arr = Array.isArray(params)
            ? (params as Array<{ marker: string; seriesName: string; value: number; axisValueLabel: string }>)
            : [];
          if (!arr.length) return '';
          const lines = arr.map((p) => {
            const v = p.seriesName.includes('%') ? `${p.value}%` : formatVol(p.value);
            return `${p.marker}<b>${p.seriesName}</b>: ${v}`;
          });
          return `<b style="color:#475569">${arr[0].axisValueLabel}</b><br/>${lines.join('<br/>')}`;
        },
      },
      legend: { show: false },
      grid: { left: 8, right: 50, top: 42, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: kanals,
        axisLabel: {
          color: '#475569',
          fontSize: 10,
          fontWeight: 'bold',
          interval: 0,
          rotate: kanals.length > 5 ? 25 : 0,
        },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: isGmv ? 'GMV (Rp)' : 'Orders',
          nameLocation: 'end',
          nameGap: 18,
          nameTextStyle: { color: '#6366f1', fontSize: 10, fontWeight: 'bold', align: 'left' },
          axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (v: number) => formatVol(v) },
          splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        {
          type: 'value',
          name: 'Return %',
          min: 0,
          max: 100,
          nameLocation: 'end',
          nameGap: 18,
          nameTextStyle: { color: '#ef4444', fontSize: 10, fontWeight: 'bold', align: 'right' },
          axisLabel: { color: '#fda4af', fontSize: 10, formatter: '{value}%' },
          splitLine: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
        },
      ],
      series: [
        {
          name: isGmv ? 'GMV' : 'Total Orders',
          type: 'bar',
          yAxisIndex: 0,
          barMaxWidth: 32,
          itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] },
          data: volume,
        },
        {
          name: 'Return %',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 2.5, color: '#ef4444' },
          itemStyle: { color: '#ef4444', borderColor: '#fff', borderWidth: 2 },
          data: retPct,
        },
      ],
    };
  }, [returnAgg, returnBasis]);

  const comboPeriodOption = useMemo(() => {
    const { periodAgg: agg, periodDates: dates } = returnAgg;
    const isGmv = returnBasis === 'gmv';
    const volume = dates.map((d) => (isGmv ? agg[d].gmv : agg[d].orders));
    const retVol = dates.map((d) => (isGmv ? agg[d].returnGmv : agg[d].returnOrders));
    const retPct = dates.map((_d, i) => +((retVol[i] / (volume[i] || 1)) * 100).toFixed(2));
    const formatVol = isGmv
      ? (v: number) => formatRupiahShort(v)
      : (v: number) => Number(v).toLocaleString('id-ID');
    const xLabels = dates.map((d) => {
      if (periodGroup === 'daily') {
        const dt = new Date(d);
        return Number.isNaN(dt.getTime()) ? d : `${MONTH_ABBR[dt.getMonth()]} ${dt.getDate()}`;
      }
      if (periodGroup === 'monthly') {
        const [y, m] = d.split('-');
        const idx = Number(m) - 1;
        return MONTH_ABBR[idx] != null ? `${MONTH_ABBR[idx]} ${y}` : d;
      }
      return d;
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', crossStyle: { color: '#cbd5e1' } },
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b', fontSize: 11 },
        formatter: (params: unknown) => {
          const arr = Array.isArray(params)
            ? (params as Array<{ marker: string; seriesName: string; value: number; dataIndex: number }>)
            : [];
          if (!arr.length) return '';
          const lines = arr.map((p) => {
            const v = p.seriesName.includes('%') ? `${p.value}%` : formatVol(p.value);
            return `${p.marker}<b>${p.seriesName}</b>: ${v}`;
          });
          return `<b style="color:#475569">${dates[arr[0].dataIndex]}</b><br/>${lines.join('<br/>')}`;
        },
      },
      legend: { show: false },
      grid: { left: 8, right: 50, top: 42, bottom: 30, containLabel: true },
      dataZoom:
        dates.length > 30
          ? [{ type: 'inside' }, { type: 'slider', height: 14, bottom: 0, brushSelect: false }]
          : [],
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLabel: { color: '#475569', fontSize: 9, interval: 'auto', fontFamily: 'monospace' },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: isGmv ? 'GMV' : 'Orders',
          nameLocation: 'end',
          nameGap: 18,
          nameTextStyle: { color: '#6366f1', fontSize: 10, fontWeight: 'bold', align: 'left' },
          axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (v: number) => formatVol(v) },
          splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        {
          type: 'value',
          name: 'Return %',
          min: 0,
          max: 100,
          nameLocation: 'end',
          nameGap: 18,
          nameTextStyle: { color: '#ef4444', fontSize: 10, fontWeight: 'bold', align: 'right' },
          axisLabel: { color: '#fda4af', fontSize: 10, formatter: '{value}%' },
          splitLine: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
        },
      ],
      series: [
        {
          name: isGmv ? 'Daily GMV' : 'Daily Orders',
          type: 'bar',
          yAxisIndex: 0,
          barMaxWidth: 18,
          itemStyle: { color: '#6366f1', borderRadius: [3, 3, 0, 0] },
          data: volume,
        },
        {
          name: 'Return %',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#ef4444' },
          itemStyle: { color: '#ef4444', borderColor: '#fff', borderWidth: 2 },
          data: retPct,
        },
      ],
    };
  }, [returnAgg, returnBasis, periodGroup]);

  return (
    <div className="flex flex-col gap-5">
      <HeaderAnalytics title="ORDER PERFORMANCE" />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {statusBadgeCards.map((card) => (
          <div key={card.title} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3
                className="text-xs font-bold tracking-widest text-slate-700 uppercase border-l-2 pl-2"
                style={{ borderColor: card.color }}
              >
                {card.title}
              </h3>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                {card.badges.length} STATUS
              </span>
            </div>
            <div className="flex overflow-x-auto gap-3 pb-2 custom-scroll">
              {loading && card.badges.length === 0 &&
                Array.from({ length: 3 }).map((_, n) => (
                  <div key={n} className="flex-shrink-0 min-w-[110px] rounded-lg p-3 border border-slate-100 bg-slate-50 animate-pulse">
                    <div className="h-2 w-16 rounded bg-slate-100 mb-2" />
                    <div className="h-5 w-12 rounded bg-slate-100 mb-2" />
                    <div className="h-2 w-10 rounded bg-slate-100" />
                  </div>
                ))}
              {card.badges.map((b) => {
                const tone = badgeTone(b.label);
                return (
                  <div
                    key={`${card.title}-${b.label}`}
                    className={`flex-shrink-0 min-w-[110px] rounded-xl p-3 border ${tone.bg}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                      <span
                        className={`text-[9px] font-mono font-bold uppercase tracking-widest truncate ${tone.text}`}
                        title={b.label}
                      >
                        {b.label}
                      </span>
                    </div>
                    <div className="text-lg font-black tabular-nums text-slate-900 leading-none">
                      {b.count.toLocaleString('id-ID')}
                    </div>
                    <div className={`text-[10px] font-mono mt-1 ${tone.text}`}>
                      {b.pct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
              {!loading && card.badges.length === 0 && (
                <div className="text-xs text-slate-400 font-mono italic py-4 px-2">No data</div>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Status Standard by SCM</h2>
          <p className="text-sm text-slate-500 mt-1">
            Analisis pengiriman, kegagalan logistik, dan rasio pengembalian (Return Rate).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-slate-100 items-stretch mb-8">
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-slate-800">Order Status Summary (Online)</h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">
              Distribusi status paket pesanan real-time di seluruh platform digital.
            </p>
            <div className="h-[300px] w-full">
              {loading && orderStackedAgg.kanals.length === 0 ? (
                <div className="h-full w-full rounded-lg bg-slate-50 animate-pulse" />
              ) : (
                <ReactECharts option={orderStackedOption} notMerge style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="text-base font-bold text-slate-800">Reason Return &amp; Analysis</h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">
              Alasan pembatalan dan retur pesanan online terbesar.
            </p>
            <div className="h-[300px] w-full">
              {loading && returnReasonRows.length === 0 ? (
                <div className="h-full w-full rounded-lg bg-slate-50 animate-pulse" />
              ) : returnReasonRows.length > 0 ? (
                <ReactECharts option={returnReasonOption} notMerge style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-xs font-mono text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Belum ada data retur pada periode aktif.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">Return Rate Analysis</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rasio retur dibandingkan total GMV atau total order kumulatif.
              </p>
            </div>
            <div className="flex items-center p-1 bg-slate-100 rounded-xl self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setReturnBasis('gmv')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  returnBasis === 'gmv'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Based on GMV
              </button>
              <button
                type="button"
                onClick={() => setReturnBasis('orders')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  returnBasis === 'orders'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Based on Orders
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-700 tracking-widest uppercase">
                  Analysis By Platform
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded">
                  Omnichannel
                </span>
              </div>
              <div className="h-[280px] w-full">
                {loading ? (
                  <div className="h-full w-full rounded-lg bg-slate-100 animate-pulse" />
                ) : (
                  <ReactECharts option={comboPlatformOption} notMerge style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-700 tracking-widest uppercase">
                  Analysis By Period
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Group By:</span>
                  <select
                    value={periodGroup}
                    onChange={(e) => setPeriodGroup(e.target.value as PeriodGroup)}
                    className="text-xs border border-slate-200 bg-white text-slate-700 rounded-md px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="h-[280px] w-full">
                {loading ? (
                  <div className="h-full w-full rounded-lg bg-slate-100 animate-pulse" />
                ) : (
                  <ReactECharts option={comboPeriodOption} notMerge style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default memo(SalesPerformanceImpl);
