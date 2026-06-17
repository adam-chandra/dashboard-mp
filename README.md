# dashboard-mp

Marketplace analytics dashboard — React 18 + TypeScript + Vite + Tailwind v4.

Port React/TS dari `frontend/` (Vue 3) yang tetap memakai backend `be-dashboard-mp` (port `8084`).
Gaya visual mengikuti `fe-dashboard-da` (utility Tailwind, kartu putih dengan border tipis).

## Persyaratan

- Node.js 18+ (disarankan 20+)
- Backend `be-dashboard-mp` berjalan di `http://localhost:8084`

## Menjalankan

```bash
cd dashboard-mp
cp .env.example .env  # sudah ada default
npm install
npm run dev           # http://localhost:5174
```

Build produksi:

```bash
npm run build
npm run preview
```

## Variabel Lingkungan

| Key | Default | Keterangan |
|-----|---------|------------|
| `VITE_API_BASE_URL` | `http://localhost:8084` | Base URL backend |

## Optimasi Performa

1. **Code-splitting + lazy routes** — `React.lazy()` per halaman, `manualChunks` Vite (`react`, `query`, `echarts`).
2. **TanStack Query** — caching, dedupe request via `queryKey` berdasarkan payload filter, `keepPreviousData` (no flicker), `staleTime` per endpoint.
3. **AbortController** otomatis dari TanStack Query (`{ signal }`) → fetch dibatalkan saat filter berubah cepat.
4. **Memoization** — `React.memo` di `KpiCards`, `TrendChart`, `OutletRanking`, `ContribChart`, `LeaderboardTable`, `MultiSelectDropdown`, `SummaryDrawer`, `HeaderAnalytics`; `useMemo` untuk opsi ECharts.
5. **Virtualisasi** — `react-window` (`FixedSizeList`) di tabel logistik & leaderboard untuk ribuan baris tanpa lag.
6. **Debounce** — pencarian logistik 500 ms (`useDebouncedValue`).
7. **Service Worker (PWA)** — `vite-plugin-pwa` cache aset statis + runtime cache `GET /api/options` (StaleWhileRevalidate) dan `/geo/*` (CacheFirst). POST analitik tidak ikut SW agar selalu mengikuti cache TanStack Query + Redis di backend.
8. **ECharts modular import** — registrasi komponen di `lib/chart.ts` saja agar bundle ECharts ramping.

## Struktur

```
src/
├── api.ts                # axios instance
├── constants.ts          # default filter, KPI list
├── types.ts              # FilterState (arrays), responses
├── lib/
│   ├── chart.ts          # registrasi modul ECharts
│   ├── date.ts           # range bulan berjalan
│   ├── filters.ts        # sanitizeMulti, buildPayload, equal
│   ├── format.ts         # rupiah/angka/growth helpers
│   └── queryClient.ts    # TanStack Query client
├── store/dashboard.ts    # zustand store (auth, filter, options, UI)
├── hooks/
│   ├── useAnalyticsQueries.ts # useMetrikQuery / useGrafikQuery / dst
│   └── useDebouncedValue.ts
├── components/           # Sidebar, HeaderAnalytics, MultiSelect, SummaryDrawer,
│                         # KpiCards, TrendChart, OutletRanking, ContribChart,
│                         # LeaderboardTable, VirtualizedLogistikTable
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx          # KPI + tren + ranking outlet
│   ├── Metrics.tsx            # tabel logistik virtualized
│   └── SalesPerformance.tsx   # kontribusi, geo, hero, leaderboard
├── App.tsx
└── main.tsx
```

## Catatan port

- `FilterState` di sini memakai **array** per dimensi (channel/kanal/nama_toko/kategori/product_name/brand/team) — sesuai backend MP (vs `fe-dashboard-da` yang single string).
- Filter **tidak** auto-refetch saat user mengubah dropdown; harus tekan tombol **TERAPKAN FILTER** (memicu `applyFilter()` di store yang menaikkan `filterKey`). Saat filter sudah diterapkan dan tidak ada perubahan, tombol berubah jadi **REFRESH** (hijau) — sama seperti perilaku `HeaderAnalytics.vue`.
- Halaman geo map (Leaflet) di `frontend/` tidak diport langsung; ringkasan top provinsi / kota ditampilkan sebagai tabel sederhana. Bisa ditambahkan kembali via lazy-import komponen Leaflet bila perlu.
- Endpoint `POST /api/login` mengembalikan user yang disimpan di `localStorage` (`ethos_user`).
```
