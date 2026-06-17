import { useEffect } from 'react';
import { useDashboardStore } from '../store/dashboard';
import {
  useGrafikQuery,
  useMetrikQuery,
  useOptionsQuery,
  usePeringkatQuery,
} from '../hooks/useAnalyticsQueries';
import { KpiCards } from '../components/KpiCards';
import { TrendChart } from '../components/TrendChart';
import { OutletRanking } from '../components/OutletRanking';
import { formatRangeLabel } from '../lib/date';

export default function Dashboard() {
  useOptionsQuery();
  const metrik = useMetrikQuery();
  const grafik = useGrafikQuery();
  const peringkat = usePeringkatQuery();

  const filter = useDashboardStore((s) => s.filter);
  const setProgress = useDashboardStore((s) => s.setProgress);

  // Progress indikatif berdasarkan jumlah query yang sedang fetching.
  useEffect(() => {
    const total = 3;
    const done = [metrik.isFetching, grafik.isFetching, peringkat.isFetching].filter((v) => !v)
      .length;
    setProgress(Math.round((done / total) * 100));
  }, [metrik.isFetching, grafik.isFetching, peringkat.isFetching, setProgress]);

  return (
    <div className="flex flex-col gap-5">
      <div className="text-xs text-zinc-500">
        Periode: <b className="text-zinc-700">{formatRangeLabel(filter.tanggal_mulai, filter.tanggal_selesai)}</b>
      </div>

      <KpiCards data={metrik.data} loading={metrik.isFetching} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TrendChart data={grafik.data} loading={grafik.isFetching} />
        </div>
        <div>
          <OutletRanking data={peringkat.data} loading={peringkat.isFetching} />
        </div>
      </div>
    </div>
  );
}
