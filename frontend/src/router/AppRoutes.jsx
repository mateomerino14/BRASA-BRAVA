import {Route, Routes} from 'react-router';
import {NAVIGATION, flattenNavigation} from '../config/navigation';
import {LoginPage} from '../features/auth/pages/LoginPage';
import {HomePage} from '../features/home/pages/HomePage';
import {ComingSoonPage} from '../features/shared/pages/ComingSoonPage';
import {NotFoundPage} from '../features/shared/pages/NotFoundPage';
import {AppShell} from './AppShell';
import {RequireAuth, RequirePermission} from './guards';

const PAGES = {home: HomePage};
const MODULE_ROUTES = flattenNavigation(NAVIGATION).filter((route) => route.permission !== 'home');

const renderModule = (permission, label) => {
  const Page = PAGES[permission];
  if (Page) {
    return <Page />;
  }
  return <ComingSoonPage title={label} />;
};

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          {MODULE_ROUTES.map(({to, label, permission}) => (
            <Route
              key={to}
              path={to}
              element={<RequirePermission permission={permission}>{renderModule(permission, label)}</RequirePermission>}
            />
          ))}
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
