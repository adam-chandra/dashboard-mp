import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { SummaryDrawer } from './components/SummaryDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import { useDashboardStore } from './store/dashboard';

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
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-5 overflow-x-hidden">
          <Suspense fallback={<PageFallback />}>{children}</Suspense>
        </main>
      </div>
      <SummaryDrawer />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const toggleSummary = useDashboardStore((s) => s.toggleSummary);

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
