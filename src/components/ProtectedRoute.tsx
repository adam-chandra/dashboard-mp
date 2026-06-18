import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDashboardStore } from '../store/dashboard';

interface Props {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: Props) {
  const user = useDashboardStore((s) => s.currentUser);
  const dashboardReady = useDashboardStore((s) => s.dashboardReady);
  const filterBusy = useDashboardStore((s) => s.filterBusy);
  const defaultFilter = useDashboardStore((s) => s.defaultFilter);
  const initDashboard = useDashboardStore((s) => s.initDashboard);
  const location = useLocation();
  const initCalled = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (initCalled.current) return;
    if (filterBusy) return;
    if (dashboardReady && defaultFilter) return;
    initCalled.current = true;
    void initDashboard();
  }, [user, dashboardReady, filterBusy, defaultFilter, initDashboard]);

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return children;
}
