import {useState} from 'react';
import {Outlet, matchPath, useLocation, useNavigate} from 'react-router';
import {MainLayout} from '../components/templates/MainLayout';
import {useAuth} from '../context/useAuth';
import {NAVIGATION, filterNavigation, flattenNavigation} from '../config/navigation';

const COLLAPSED_KEY = 'brasa.sidebarCollapsed';
const ROUTES = flattenNavigation(NAVIGATION);

const titleFor = (pathname) => {
  const route = ROUTES.find((item) => matchPath({path: item.to, end: true}, pathname));
  return route?.title ?? '';
};

export function AppShell() {
  const {user, logout} = useAuth();
  const {pathname} = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1');

  const toggleCollapsed = () => {
    const next = !collapsed;
    localStorage.setItem(COLLAPSED_KEY, String(Number(next)));
    setCollapsed(next);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', {replace: true});
  };

  return (
    <MainLayout
      sidebarItems={filterNavigation(NAVIGATION, user?.permissions)}
      user={user}
      title={titleFor(pathname)}
      onLogout={handleLogout}
      collapsed={collapsed}
      onToggleCollapsed={toggleCollapsed}
      pageKey={pathname}
    >
      <Outlet />
    </MainLayout>
  );
}
