import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { HeaderAnalytics } from './components/HeaderAnalytics';
import { SummaryDrawer } from './components/SummaryDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import { useDashboardStore } from './store/dashboard';

// Lazy-load page bundles agar initial JS lebih kecil.
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Metrics = lazy(() => import('./pages/Metrics'));
const SalesPerformance = lazy(() => import('./pages/SalesPerformance'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-64 text-sm text-zinc-400 animate-pulse">
      Memuat halaman…
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const summaryOpen = useDashboardStore((s) => s.summaryOpen);
  const toggleSummary = useDashboardStore((s) => s.toggleSummary);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderAnalytics onOpenSummary={() => toggleSummary(true)} />
        <main className="flex-1 p-5 overflow-x-hidden">
          <Suspense fallback={<PageFallback />}>{children}</Suspense>
        </main>
      </div>
      <SummaryDrawer />
      {/* close drawer when route changes via store; nothing to render here */}
      <span className="sr-only">{summaryOpen ? 'drawer-open' : 'drawer-closed'}</span>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const toggleSummary = useDashboardStore((s) => s.toggleSummary);

  // Tutup drawer otomatis saat pindah route.
  useEffect(() => {
    toggleSummary(false);
  }, [location.pathname, toggleSummary]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageFallback />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <Dashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales-performance"
        element={
          <ProtectedRoute>
            <AppShell>
              <SalesPerformance />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/metrics"
        element={
          <ProtectedRoute>
            <AppShell>
              <Metrics />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Dashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
