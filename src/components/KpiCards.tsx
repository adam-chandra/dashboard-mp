import { memo } from 'react';
import { calcGrowth, formatAngka, formatRupiahShort, growthClass, growthLabel } from '../lib/format';
import { KPI_LIST } from '../constants';
import type { MetrikResponse } from '../types';

interface Props {
  data: MetrikResponse | undefined;
  loading?: boolean;
}

function KpiCardsImpl({ data, loading }: Props) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {KPI_LIST.map((k) => {
        const d = data?.[k.key as keyof MetrikResponse] ?? { sekarang: 0, lalu: 0 };
        const g = calcGrowth(d.sekarang, d.lalu);
        const value =
          k.key === 'gmv' ? formatRupiahShort(d.sekarang) : `${formatAngka(d.sekarang)} ${k.unit}`;
        return (
          <div
            key={k.key}
            className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition"
          >
            <div className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
              {k.title}
            </div>
            <div className="mt-2 text-2xl font-bold text-zinc-800 font-mono">
              {loading ? <span className="skeleton inline-block w-32 h-7 rounded" /> : value}
            </div>
            <div className={`mt-1 text-xs font-medium ${growthClass(g)}`}>
              {loading ? '—' : `${growthLabel(g)} vs sebelumnya`}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export const KpiCards = memo(KpiCardsImpl);
