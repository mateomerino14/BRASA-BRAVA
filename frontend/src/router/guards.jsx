import {Navigate, Outlet, useLocation} from 'react-router';
import {Logo} from '../components/atoms/Logo';
import {useAuth} from '../context/useAuth';

const styles = {
  loader: 'flex min-h-dvh items-center justify-center bg-lienzo',
};

export function SessionLoader() {
  return (
    <div role="status" aria-label="Validando sesión" className={styles.loader}>
      <Logo size={120} glow />
    </div>
  );
}

export function RequireAuth() {
  const {status} = useAuth();
  const location = useLocation();
  if (status === 'checking') {
    return <SessionLoader />;
  }
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{from: location.pathname}} />;
  }
  return <Outlet />;
}

export function RequirePermission({permission, children}) {
  const {user} = useAuth();
  const allowed = user?.isDirectorio || user?.permissions?.includes(permission);
  if (!allowed) {
    return <Navigate to="/" replace />;
  }
  return children;
}
