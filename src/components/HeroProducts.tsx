import { memo, useMemo } from 'react';
import type { HeroProduct } from '../types';
import { formatRupiahShort } from '../lib/format';

interface Props {
  data: HeroProduct[] | undefined;
  loading?: boolean;
}

function HeroProductsImpl({ data, loading }: Props) {
  const heroes = useMemo(() => data ?? [], [data]);

  return (
    <section className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-xs font-bold tracking-widest text-zinc-700 uppercase border-l-2 border-amber-500 pl-2">
            Hero Products Backbone
          </h2>
          <p className="text-[10px] font-mono text-zinc-400 mt-1 pl-2">
            Produk inti dengan kontribusi omset terbesar.
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700">
          {heroes.length} HERO
        </span>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scroll pr-1">
        {loading && heroes.length === 0 && (
          <>
            {[0, 1, 2].map((n) => (
              <div key={n} className="h-20 rounded-xl bg-zinc-50 animate-pulse" />
            ))}
          </>
        )}
        {!loading && heroes.length === 0 && (
          <div className="text-xs text-zinc-400 italic py-4 text-center border border-dashed border-zinc-200 rounded-lg">
            Belum ada hero product pada periode aktif.
          </div>
        )}
        {heroes.map((p, i) => {
          const pct = (Number(p.share) || 0) * 100;
          return (
            <div
              key={`${p.product_name}-${i}`}
              className="relative rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-3 overflow-hidden"
            >
              <span className="absolute top-2 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white tracking-widest">
                HERO
              </span>
              <div className="text-[10px] font-mono text-amber-700 uppercase tracking-widest">
                {p.brand || '—'}
              </div>
              <div className="text-sm font-bold text-zinc-800 mt-0.5 leading-tight pr-12">
                {p.product_name}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="font-mono text-zinc-700">{formatRupiahShort(p.gmv)}</span>
                <span className="font-mono font-bold text-amber-700">{pct.toFixed(1)}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-amber-100 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export const HeroProducts = memo(HeroProductsImpl);
