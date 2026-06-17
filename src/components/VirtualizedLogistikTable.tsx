import { memo, useMemo } from 'react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import type { LogistikItem } from '../types';

interface Props {
  data: LogistikItem[] | undefined;
  loading?: boolean;
  height?: number;
}

const ROW_H = 40;

function statusBadge(status: string | undefined, base: string): string {
  const s = (status ?? '').toLowerCase();
  if (!s) return `${base} bg-zinc-100 text-zinc-500`;
  if (s.includes('done') || s.includes('selesai') || s.includes('terkirim'))
    return `${base} bg-emerald-50 text-emerald-700`;
  if (s.includes('proses') || s.includes('process') || s.includes('packing'))
    return `${base} bg-amber-50 text-amber-700`;
  if (s.includes('batal') || s.includes('cancel') || s.includes('retur') || s.includes('return'))
    return `${base} bg-rose-50 text-rose-700`;
  return `${base} bg-sky-50 text-sky-700`;
}

function Row({ index, style, data }: ListChildComponentProps<LogistikItem[]>) {
  const r = data[index];
  if (!r) return null;
  const cell = 'px-2 py-1 text-xs whitespace-nowrap overflow-hidden text-ellipsis';
  return (
    <div
      style={style}
      className={`grid grid-cols-[40px_110px_180px_minmax(0,1.4fr)_120px_140px_140px_120px] items-center
        ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/60'}`}
    >
      <div className={`${cell} font-mono text-zinc-400`}>{index + 1}</div>
      <div className={`${cell} text-zinc-600`}>{r.tanggal}</div>
      <div className={`${cell} font-mono text-zinc-800`}>{r.order_number}</div>
      <div className={`${cell} text-zinc-800`} title={r.nama_toko}>{r.nama_toko}</div>
      <div className={`${cell} text-zinc-700`}>{r.kanal}</div>
      <div className={cell}>
        <span className={statusBadge(r.status_fix, 'px-2 py-0.5 rounded text-[11px] font-medium')}>
          {r.status_fix || '-'}
        </span>
      </div>
      <div className={cell}>
        <span className={statusBadge(r.status_3pl, 'px-2 py-0.5 rounded text-[11px] font-medium')}>
          {r.status_3pl || '-'}
        </span>
      </div>
      <div className={cell}>
        <span className={statusBadge(r.status_wms, 'px-2 py-0.5 rounded text-[11px] font-medium')}>
          {r.status_wms || '-'}
        </span>
      </div>
    </div>
  );
}

function VirtualizedLogistikTableImpl({ data, loading, height = 520 }: Props) {
  const rows = useMemo(() => data ?? [], [data]);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-[40px_110px_180px_minmax(0,1.4fr)_120px_140px_140px_120px] px-2 py-2 text-[10px] font-bold tracking-wider text-zinc-500 uppercase border-b border-zinc-200 bg-zinc-50">
        <div>#</div>
        <div>Tanggal</div>
        <div>Order Number</div>
        <div>Distribution Outlet</div>
        <div>Kanal</div>
        <div>Status Standar</div>
        <div>Status Toko</div>
        <div>Status WMS</div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="p-6 text-center text-xs text-zinc-400 animate-pulse">Memuat…</div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-center text-xs text-zinc-400">Tidak ada data.</div>
      ) : (
        <FixedSizeList
          height={height}
          itemCount={rows.length}
          itemSize={ROW_H}
          width="100%"
          itemData={rows}
        >
          {Row}
        </FixedSizeList>
      )}
    </div>
  );
}

export const VirtualizedLogistikTable = memo(VirtualizedLogistikTableImpl);
