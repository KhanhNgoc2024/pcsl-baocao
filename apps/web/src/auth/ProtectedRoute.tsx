import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore, coVaiTro } from './store';

export function ProtectedRoute({ roles }: { roles?: string[] }) {
  const { user, daNap } = useAuthStore();

  if (!daNap) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !coVaiTro(user, ...roles)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
