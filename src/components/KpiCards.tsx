import { memo } from 'react';
import {
  calcGrowth,
  formatAngka,
  formatRupiahShort,
  growthClass,
  growthLabel,
} from '../lib/format';
import { KPI_LIST } from '../constants';
import type { MetrikResponse } from '../types';

interface Props {
  data: MetrikResponse | undefined;
  loading?: boolean;
}

const COLOR_MAP: Record<string, { bar: string; pill: string }> = {
  sky: { bar: 'bg-sky-500', pill: 'bg-sky-50 text-sky-700 border-sky-200' },
  amber: { bar: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  violet: { bar: 'bg-violet-500', pill: 'bg-violet-50 text-violet-700 border-violet-200' },
  emerald: {
    bar: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

function KpiCardsImpl({ data, loading }: Props) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {KPI_LIST.map((k) => {
        const d = data?.[k.key as keyof MetrikResponse] ?? { sekarang: 0, lalu: 0 };
        const g = calcGrowth(d.sekarang, d.lalu);
        const value =
          k.key === 'gmv'
            ? formatRupiahShort(d.sekarang)
            : `${formatAngka(d.sekarang)} ${k.unit}`;
        const prevValue =
          k.key === 'gmv' ? formatRupiahShort(d.lalu) : `${formatAngka(d.lalu)} ${k.unit}`;
        const c = COLOR_MAP[k.color] ?? COLOR_MAP.sky;
        return (
          <div
            key={k.key}
            className="relative bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition overflow-hidden"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} aria-hidden />
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                {k.title}
              </div>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${c.pill}`}
              >
                {k.unit}
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-zinc-900 font-mono tabular-nums">
              {loading ? (
                <span className="inline-block w-32 h-7 rounded bg-zinc-100 animate-pulse" />
              ) : (
                value
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              {loading ? (
                <span className="text-zinc-400">—</span>
              ) : (
                <>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold ${growthClass(
                      g
                    )} ${
                      g > 0
                        ? 'bg-emerald-50 border border-emerald-100'
                        : g < 0
                          ? 'bg-rose-50 border border-rose-100'
                          : 'bg-zinc-50 border border-zinc-100'
                    }`}
                  >
                    {growthLabel(g)}
                  </span>
                  <span className="text-zinc-400 font-mono">vs {prevValue}</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export const KpiCards = memo(KpiCardsImpl);
