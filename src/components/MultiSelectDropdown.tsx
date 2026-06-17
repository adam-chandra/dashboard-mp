import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  modelValue: string[];
  options: string[];
  noun?: string;
  disabled?: boolean;
  searchable?: boolean;
  onChange: (next: string[]) => void;
}

function normalize(options: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of options ?? []) {
    const v = (raw ?? '').toString().trim();
    if (!v) continue;
    if (/^semua\b/i.test(v)) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function MultiSelectDropdownImpl({
  modelValue,
  options,
  noun = 'opsi',
  disabled = false,
  searchable = true,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);

  const normalized = useMemo(() => normalize(options), [options]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter((o) => o.toLowerCase().includes(q));
  }, [normalized, search]);

  const selectedSet = useMemo(() => {
    const s = new Set<string>();
    for (const v of modelValue ?? []) {
      if (!v) continue;
      if (/^semua\b/i.test(v)) continue;
      s.add(v);
    }
    return s;
  }, [modelValue]);

  const allSelected = normalized.length > 0 && selectedSet.size === normalized.length;
  const partial = selectedSet.size > 0 && !allSelected;

  const displayLabel = useMemo(() => {
    if (selectedSet.size === 0) return `Semua ${noun}`;
    if (allSelected) return `Semua ${noun}`;
    if (selectedSet.size === 1) return Array.from(selectedSet)[0];
    return `${selectedSet.size} ${noun} dipilih`;
  }, [selectedSet, allSelected, noun]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, close]);

  const toggleOne = (v: string) => {
    const next = new Set(selectedSet);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(Array.from(next));
  };

  const toggleAll = () => {
    if (allSelected) onChange([]);
    else onChange([...normalized]);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`w-full text-left px-3 h-10 rounded-lg border bg-white text-sm flex items-center justify-between gap-2 transition
          ${disabled ? 'opacity-50 cursor-not-allowed border-zinc-200' : 'border-zinc-300 hover:border-zinc-400'}`}
      >
        <span className={`truncate ${selectedSet.size === 0 ? 'text-zinc-500' : 'text-zinc-800'}`}>
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.24 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg max-h-72 overflow-hidden flex flex-col">
          {searchable && (
            <div className="p-2 border-b border-zinc-100">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Cari ${noun}…`}
                className="w-full px-2 h-9 rounded border border-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          )}
          <label className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-zinc-50 border-b border-zinc-100 text-sm">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = partial;
              }}
              onChange={toggleAll}
            />
            <span className="font-medium">Pilih Semua</span>
          </label>
          <div className="overflow-auto custom-scroll flex-1">
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-xs text-zinc-500">Tidak ada opsi.</div>
            )}
            {filtered.map((o) => (
              <label
                key={o}
                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-zinc-50 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(o)}
                  onChange={() => toggleOne(o)}
                />
                <span className="truncate">{o}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const MultiSelectDropdown = memo(MultiSelectDropdownImpl);
