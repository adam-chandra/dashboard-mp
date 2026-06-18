export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function getMonthRange(now: Date = new Date()): {
  tanggal_mulai: string;
  tanggal_selesai: string;
} {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { tanggal_mulai: formatDateISO(start), tanggal_selesai: formatDateISO(end) };
}

export function shiftPrevMonth(start: string, end: string): { mulai: string; selesai: string } {
  const s = new Date(start);
  const e = new Date(end);
  const prevStart = new Date(s.getFullYear(), s.getMonth() - 1, 1);
  const prevEnd = new Date(e.getFullYear(), e.getMonth(), 0);
  return { mulai: formatDateISO(prevStart), selesai: formatDateISO(prevEnd) };
}

const ID_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatLabelOne(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${ID_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatRangeLabel(start: string, end: string): string {
  if (!start && !end) return '';
  return `${formatLabelOne(start)} - ${formatLabelOne(end)}`;
}
