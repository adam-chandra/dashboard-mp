const NF_INT = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

export function formatAngka(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '0';
  return NF_INT.format(Math.round(v));
}

export function formatRupiah(v: number | null | undefined): string {
  return `Rp ${formatAngka(v)}`;
}

export function formatRupiahShort(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return 'Rp 0';
  const n = Math.abs(v);
  if (n >= 1_000_000_000_000) return `Rp ${(v / 1_000_000_000_000).toFixed(2)} T`;
  if (n >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(2)} M`;
  if (n >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(2)} Jt`;
  if (n >= 1_000) return `Rp ${(v / 1_000).toFixed(1)} Rb`;
  return `Rp ${v}`;
}

export function formatAngkaShort(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '0';
  const n = Math.abs(v);
  if (n >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)} M`;
  if (n >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} Jt`;
  if (n >= 1_000) return `${(v / 1_000).toFixed(1)} Rb`;
  return String(Math.round(v));
}

export function calcGrowth(sekarang: number, lalu: number): number {
  if (!lalu || lalu === 0) return sekarang > 0 ? 100 : 0;
  return ((sekarang - lalu) / lalu) * 100;
}

export function growthLabel(g: number): string {
  if (!Number.isFinite(g)) return '—';
  if (g > 0) return `▲ ${g.toFixed(1)}%`;
  if (g < 0) return `▼ ${Math.abs(g).toFixed(1)}%`;
  return '— 0%';
}

export function growthClass(g: number): string {
  if (!Number.isFinite(g) || g === 0) return 'text-zinc-500';
  return g > 0 ? 'text-emerald-600' : 'text-rose-600';
}

export function growthVerb(g: number): string {
  if (g > 0) return 'kenaikan';
  if (g < 0) return 'penurunan';
  return 'stagnasi';
}
