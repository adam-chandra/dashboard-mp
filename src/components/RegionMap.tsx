import { memo, useEffect, useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { GeoItem } from '../types';
import { formatRupiahShort, formatRupiah } from '../lib/format';
import {
  CHOROPLETH,
  GEOJSON_URLS,
  MAP_EMPTY_AREA,
  extractGeoName,
  fetchGeoJSON,
  isCleanRegion,
  normKota,
  normProvinsi,
} from '../lib/geo';
import { echarts, ensureEchartsRegistered } from '../lib/chart';
import type { EChartsInstance } from 'echarts-for-react';

ensureEchartsRegistered();

interface Props {
  topProvinsi: GeoItem[];
  topKota: GeoItem[];
  provinsiMappingStats?: { mapped_count: number; unmapped_count: number };
  loading?: boolean;
}

type MapMode = 'provinsi' | 'kota';

interface Registry {
  provinsi: boolean;
  kabkota: boolean;
  lookup: Record<string, string[]>;
}

const REGISTRY: Registry = { provinsi: false, kabkota: false, lookup: {} };

async function loadAndRegister(mode: MapMode): Promise<void> {
  if (mode === 'provinsi' && REGISTRY.provinsi) return;
  if (mode === 'kota' && REGISTRY.kabkota) return;

  if (mode === 'provinsi') {
    const gj = await fetchGeoJSON(GEOJSON_URLS.provinsi);
    if (gj?.features) {
      for (const f of gj.features) {
        if (!f?.properties) continue;
        f.properties.name = normProvinsi(extractGeoName(f.properties));
      }
    }
    echarts.registerMap('indonesia_prov', gj as unknown as Parameters<typeof echarts.registerMap>[1]);
    REGISTRY.provinsi = true;
  } else {
    const gj = await fetchGeoJSON(GEOJSON_URLS.kabkota);
    const lookup = new Map<string, string[]>();
    if (gj?.features) {
      for (const f of gj.features) {
        if (!f?.properties) continue;
        const original = String(extractGeoName(f.properties)).toUpperCase().trim();
        f.properties.name = original;
        const stripped = normKota(original);
        const arr = lookup.get(stripped) || [];
        arr.push(original);
        lookup.set(stripped, arr);
      }
    }
    REGISTRY.lookup = Object.fromEntries(lookup);
    echarts.registerMap('indonesia_kab', gj as unknown as Parameters<typeof echarts.registerMap>[1]);
    REGISTRY.kabkota = true;
  }
}

function RegionMapImpl({
  topProvinsi,
  topKota,
  provinsiMappingStats,
  loading,
}: Props) {
  const [mode, setMode] = useState<MapMode>('provinsi');
  const [ready, setReady] = useState<{ provinsi: boolean; kabkota: boolean }>({
    provinsi: REGISTRY.provinsi,
    kabkota: REGISTRY.kabkota,
  });
  const [showAll, setShowAll] = useState(false);
  const [mapError, setMapError] = useState('');
  const echartsRef = useRef<{ getEchartsInstance(): EChartsInstance } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMapError('');
    void (async () => {
      try {
        await loadAndRegister(mode);
        if (cancelled) return;
        setReady({ provinsi: REGISTRY.provinsi, kabkota: REGISTRY.kabkota });
      } catch {
        if (!cancelled) setMapError('Gagal memuat batas wilayah. Cek koneksi internet Anda.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const cleanProvinsi = useMemo(
    () => (topProvinsi ?? []).filter((p) => isCleanRegion(p.wilayah)),
    [topProvinsi]
  );
  const cleanKota = useMemo(
    () => (topKota ?? []).filter((c) => isCleanRegion(c.wilayah)),
    [topKota]
  );
  const top5Provinsi = useMemo(() => cleanProvinsi.slice(0, 5), [cleanProvinsi]);
  const top5Kota = useMemo(() => cleanKota.slice(0, 5), [cleanKota]);
  const maxProvinsi = useMemo(
    () => Math.max(1, ...cleanProvinsi.map((x) => x.omset || 0)),
    [cleanProvinsi]
  );
  const maxKota = useMemo(
    () => Math.max(1, ...cleanKota.map((x) => x.omset || 0)),
    [cleanKota]
  );
  const activeRanking = mode === 'provinsi' ? top5Provinsi : top5Kota;
  const activeMax = mode === 'provinsi' ? maxProvinsi : maxKota;
  const otherRanking = useMemo(
    () => (mode === 'provinsi' ? cleanKota.slice(0, 3) : cleanProvinsi.slice(0, 3)),
    [mode, cleanKota, cleanProvinsi]
  );

  const mapSeriesData = useMemo(() => {
    if (mode === 'provinsi') {
      const idx = new Map<string, number>();
      for (const p of cleanProvinsi) {
        const name = normProvinsi(p.wilayah);
        if (!name) continue;
        idx.set(name, (idx.get(name) || 0) + (Number(p.omset) || 0));
      }
      return Array.from(idx, ([name, value]) => ({ name, value }));
    }
    const lookup = REGISTRY.lookup;
    const out = new Map<string, number>();
    for (const c of cleanKota) {
      const stripped = normKota(c.wilayah);
      if (!stripped) continue;
      const targets = lookup[stripped] || [];
      if (!targets.length) continue;
      const omset = Number(c.omset) || 0;
      for (const polyName of targets) {
        out.set(polyName, (out.get(polyName) || 0) + omset);
      }
    }
    return Array.from(out, ([name, value]) => ({ name, value }));
  }, [mode, cleanProvinsi, cleanKota]);

  const mapMax = useMemo(() => {
    let m = 0;
    for (const d of mapSeriesData) if (d.value > m) m = d.value;
    return m || 1;
  }, [mapSeriesData]);

  const coverage = useMemo(() => {
    if (mode !== 'kota') {
      const provList = topProvinsi ?? [];
      let provMapped = 0;
      let provUnmapped = 0;
      const stats = provinsiMappingStats;
      if (stats && (Number(stats.mapped_count) > 0 || Number(stats.unmapped_count) > 0)) {
        provMapped = Number(stats.mapped_count) || 0;
        provUnmapped = Number(stats.unmapped_count) || 0;
      } else {
        for (const p of provList) {
          if (!isCleanRegion(p.wilayah) || !normProvinsi(p.wilayah)) provUnmapped += 1;
          else provMapped += 1;
        }
      }
      return { mapped: provMapped, unmapped: provUnmapped, unmappedCities: [] as GeoItem[] };
    }
    const lookup = REGISTRY.lookup;
    const unmapped: GeoItem[] = [];
    let mappedCount = 0;
    for (const c of topKota ?? []) {
      const region = c?.wilayah;
      if (!isCleanRegion(region)) {
        unmapped.push({ wilayah: region || 'Tidak Terpetakan', omset: Number(c?.omset) || 0 });
        continue;
      }
      const stripped = normKota(region);
      const hit = stripped && lookup[stripped];
      if (!hit) {
        unmapped.push({ wilayah: region, omset: Number(c.omset) || 0 });
        continue;
      }
      mappedCount += 1;
    }
    unmapped.sort((a, b) => (b.omset || 0) - (a.omset || 0));
    return { mapped: mappedCount, unmapped: unmapped.length, unmappedCities: unmapped };
  }, [mode, topProvinsi, topKota, provinsiMappingStats]);

  const mapOption = useMemo(() => {
    const mapName = mode === 'provinsi' ? 'indonesia_prov' : 'indonesia_kab';
    const headerL = mode === 'provinsi' ? 'Provinsi' : 'Kabupaten / Kota';
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#334155', fontSize: 12 },
        formatter: (p: { name: string; data?: { value: number } }) => {
          const v = p?.data?.value;
          const header = `<div style="font-size:10px;letter-spacing:.12em;color:#94a3b8;text-transform:uppercase;font-family:ui-monospace,monospace">${headerL}</div>`;
          const title = `<div style="font-weight:700;color:#1e293b;font-size:13px;margin-top:2px">${p.name}</div>`;
          const body =
            v == null || v <= 0
              ? `<div style="color:#94a3b8;margin-top:4px;font-size:11px;font-style:italic">Tidak ada penjualan</div>`
              : `<div style="color:#475569;margin-top:4px;font-size:11px">Total Omset: <span style="color:#4f46e5;font-weight:700">${formatRupiah(v)}</span></div>`;
          return header + title + body;
        },
      },
      visualMap: {
        type: 'continuous',
        min: 0,
        max: mapMax,
        left: 12,
        bottom: 14,
        itemWidth: 12,
        itemHeight: 100,
        calculable: false,
        text: ['HIGH', 'LOW'],
        textStyle: { color: '#64748b', fontSize: 10, fontWeight: 'bold' },
        inRange: { color: CHOROPLETH },
      },
      series: [
        {
          type: 'map',
          map: mapName,
          roam: true,
          zoom: 1.25,
          scaleLimit: { min: 1, max: 6 },
          aspectScale: 0.92,
          layoutCenter: ['50%', '50%'],
          layoutSize: '138%',
          label: { show: false },
          itemStyle: {
            areaColor: MAP_EMPTY_AREA,
            borderColor: '#cbd5e1',
            borderWidth: mode === 'provinsi' ? 0.6 : 0.35,
          },
          emphasis: {
            disabled: false,
            label: { show: false },
            itemStyle: {
              areaColor: '#6366f1',
              borderColor: '#4f46e5',
              borderWidth: 1.2,
              shadowBlur: 6,
              shadowColor: 'rgba(79, 70, 229, 0.25)',
            },
          },
          select: { disabled: true },
          animationDuration: 350,
          animationDurationUpdate: 280,
          animationEasingUpdate: 'cubicOut',
          universalTransition: false,
          data: mapSeriesData,
        },
      ],
    };
  }, [mode, mapMax, mapSeriesData]);

  const modeReady = mode === 'provinsi' ? ready.provinsi : ready.kabkota;

  const zoomMap = (factor: number) => {
    const inst = echartsRef.current?.getEchartsInstance();
    if (!inst) return;
    const dom = inst.getDom() as HTMLElement | undefined;
    const w = dom?.clientWidth || 0;
    const h = dom?.clientHeight || 0;
    inst.dispatchAction({
      type: 'geoRoam',
      componentType: 'series',
      seriesIndex: 0,
      zoom: factor,
      originX: w / 2,
      originY: h / 2,
    });
  };
  const resetMapZoom = () => {
    const inst = echartsRef.current?.getEchartsInstance();
    if (!inst) return;
    inst.setOption(mapOption, { notMerge: true });
  };

  const totalMapped = coverage.mapped + coverage.unmapped;

  return (
    <section className="w-full bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xs font-bold tracking-widest text-zinc-700 border-l-2 border-indigo-500 pl-2 uppercase">
            Geographic &amp; Demographic Distribution
          </h2>
          <p className="text-[11px] text-zinc-400 font-mono mt-1 pl-2">
            {mode === 'provinsi'
              ? 'Intensitas penjualan per provinsi Indonesia (choropleth)'
              : 'Intensitas penjualan per kabupaten/kota — tiap polygon mandiri'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center bg-zinc-100 border border-zinc-200 rounded-lg p-1 gap-1">
            {(['provinsi', 'kota'] as MapMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-colors duration-150 ${
                  mode === m
                    ? 'bg-zinc-900 text-white shadow'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {m === 'provinsi' ? 'Provinsi' : 'Kota'}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-zinc-400">
            <span className="uppercase tracking-widest">Low</span>
            <div className="flex items-center gap-0.5">
              {CHOROPLETH.map((c) => (
                <span key={c} className="h-2.5 w-3" style={{ background: c }} />
              ))}
            </div>
            <span className="text-zinc-500 font-bold uppercase tracking-widest">High</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative">
          <div className="h-[480px] w-full rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
            {loading || !modeReady ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 animate-pulse">
                <div className="w-3/4 h-3/4 rounded-2xl bg-slate-200" />
                <div className="h-2 w-32 rounded bg-slate-200" />
              </div>
            ) : (
              <ReactECharts
                ref={(r) => {
                  echartsRef.current = r as unknown as { getEchartsInstance(): EChartsInstance } | null;
                }}
                option={mapOption}
                notMerge
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            )}
          </div>

          {!loading && modeReady && (
            <div className="absolute top-3 right-3 flex flex-col bg-white/95 backdrop-blur-sm border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => zoomMap(1.25)}
                title="Zoom in"
                className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-zinc-200"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => zoomMap(1 / 1.25)}
                title="Zoom out"
                className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-zinc-200"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                type="button"
                onClick={resetMapZoom}
                title="Reset zoom"
                className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <polyline points="3 4 3 10 9 10" />
                </svg>
              </button>
            </div>
          )}

          {mapError && (
            <div className="absolute bottom-3 left-3 right-3 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-mono px-3 py-2 rounded-lg shadow">
              {mapError}
            </div>
          )}

          {!loading && modeReady && totalMapped > 0 && (
            <div className="absolute top-4 left-4 z-10 bg-white border border-gray-100 rounded-xl shadow-md px-4 py-2 flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span className="text-xs font-semibold text-gray-700">
                  <span className="text-indigo-600">{coverage.mapped}</span> MAPPED
                </span>
              </span>
              <span className="text-gray-300">/</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-gray-700">
                  <span className="text-amber-500">{coverage.unmapped}</span> UNMAPPED
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Top 5 {mode === 'provinsi' ? 'Provinsi' : 'Kota'}
              </div>
              <span className="text-[9px] font-mono text-zinc-300">RANK</span>
            </div>
            {loading ? (
              <ul className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, n) => (
                  <li key={n} className="animate-pulse flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="h-3 w-32 rounded bg-slate-200" />
                      <div className="h-3 w-16 rounded bg-slate-200" />
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200" />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="flex flex-col gap-3">
                {activeRanking.map((r, i) => (
                  <li key={`rk-${r.wilayah}-${i}`} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-700 truncate">
                        {i + 1}. {r.wilayah}
                      </span>
                      <span className="text-[11px] font-black tabular-nums text-zinc-900">
                        {formatRupiahShort(r.omset)}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.max(2, Math.min(100, (r.omset / activeMax) * 100))}%` }}
                      />
                    </div>
                  </li>
                ))}
                {activeRanking.length === 0 && (
                  <li className="text-xs italic text-zinc-400">
                    Tidak ada data {mode === 'provinsi' ? 'provinsi' : 'kota'}.
                  </li>
                )}
              </ul>
            )}
          </div>

          {!loading && otherRanking.length > 0 && (
            <div className="border-t border-zinc-100 pt-3">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-2">
                Top 3 {mode === 'provinsi' ? 'Kota' : 'Provinsi'}{' '}
                <span className="normal-case font-mono text-zinc-300">— pembanding</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {otherRanking.map((r, i) => (
                  <li
                    key={`or-${r.wilayah}-${i}`}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <span className="text-zinc-500 truncate">{i + 1}. {r.wilayah}</span>
                    <span className="font-mono tabular-nums text-zinc-600">
                      {formatRupiahShort(r.omset)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!loading && mode === 'kota' && coverage.unmappedCities.length > 0 && (
            <div className="border-t border-zinc-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-mono text-amber-600 uppercase tracking-widest font-bold">
                  Unmapped Cities
                </div>
                <span className="text-[9px] font-mono text-zinc-400">
                  {coverage.unmappedCities.length}
                </span>
              </div>
              <p className="text-[10px] font-mono text-zinc-400 leading-snug mb-2">
                Kota di bawah ini belum terpetakan ke provinsi sehingga tidak ikut mewarnai peta.
              </p>
              <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto custom-scroll pr-1">
                {coverage.unmappedCities.map((c, i) => (
                  <li
                    key={`um-${c.wilayah}-${i}`}
                    className="flex items-center justify-between text-[11px] py-1 border-b border-amber-50 last:border-0"
                  >
                    <span className="text-zinc-600 truncate font-semibold">{c.wilayah}</span>
                    <span className="font-mono tabular-nums text-amber-700 font-bold">
                      {formatRupiahShort(c.omset)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="w-full text-center py-2 px-4 border border-zinc-200 rounded-xl text-xs font-semibold text-indigo-600 hover:bg-zinc-50 transition-colors mt-2"
          >
            {showAll ? 'Hide All Region' : 'Show All Region'}
          </button>
        </div>
      </div>

      {showAll && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <AllRegionList title="All Provinsi" rows={cleanProvinsi} loading={!!loading} />
          <AllRegionList title="All Kota" rows={cleanKota} loading={!!loading} />
        </div>
      )}
    </section>
  );
}

function AllRegionList({
  title,
  rows,
  loading,
}: {
  title: string;
  rows: GeoItem[];
  loading: boolean;
}) {
  return (
    <div className="border border-zinc-100 rounded-xl overflow-hidden">
      <div className="bg-zinc-50 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 border-b border-zinc-100">
        {title}
      </div>
      <ul className="max-h-64 overflow-y-auto custom-scroll divide-y divide-zinc-100">
        {loading &&
          Array.from({ length: 6 }).map((_, n) => (
            <li
              key={`sk-${title}-${n}`}
              className="flex items-center justify-between px-3 py-1.5 animate-pulse"
            >
              <div className="h-3 w-28 rounded bg-slate-200" />
              <div className="h-3 w-14 rounded bg-slate-200" />
            </li>
          ))}
        {!loading &&
          rows.map((r, i) => (
            <li
              key={`row-${title}-${i}`}
              className="flex items-center justify-between px-3 py-1.5 text-xs"
            >
              <span className="font-semibold text-zinc-700 truncate">
                {i + 1}. {r.wilayah}
              </span>
              <span className="font-mono text-zinc-500 tabular-nums">
                {formatRupiahShort(r.omset)}
              </span>
            </li>
          ))}
        {!loading && rows.length === 0 && (
          <li className="px-3 py-3 text-xs italic text-zinc-400">Belum ada data.</li>
        )}
      </ul>
    </div>
  );
}

export const RegionMap = memo(RegionMapImpl);
