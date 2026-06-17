import { Navigate, useLocation } from 'react-router-dom';
import { useDashboardStore } from '../store/dashboard';

interface Props {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: Props) {
  const user = useDashboardStore((s) => s.currentUser);
  const location = useLocation();
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return children;
}
