import {Suspense, lazy} from 'react';
import {Route, Routes} from 'react-router';
import {NAVIGATION, flattenNavigation} from '../config/navigation';
import {LoginPage} from '../features/auth/pages/LoginPage';
import {HomePage} from '../features/home/pages/HomePage';
import {ComingSoonPage} from '../features/shared/pages/ComingSoonPage';
import {NotFoundPage} from '../features/shared/pages/NotFoundPage';
import {AppShell} from './AppShell';
import {RequireAuth, RequirePermission} from './guards';
import {PageLoader} from './PageLoader';

// Cada pantalla de módulo se descarga recién cuando se abre, así el inicio carga solo lo necesario
const lazyPage = (load, name) => lazy(() => load().then((module) => ({default: module[name]})));

const PAGES = {
  empleados: lazyPage(() => import('../features/employees/pages/EmployeesPage'), 'EmployeesPage'),
  categorias: lazyPage(() => import('../features/categories/pages/CategoriesPage'), 'CategoriesPage'),
  productos: lazyPage(() => import('../features/products/pages/ProductsPage'), 'ProductsPage'),
  stock: lazyPage(() => import('../features/stock/pages/StockPage'), 'StockPage'),
  secciones: lazyPage(() => import('../features/sections/pages/SectionsPage'), 'SectionsPage'),
  promociones: lazyPage(() => import('../features/promotions/pages/PromotionsPage'), 'PromotionsPage'),
};
const MODULE_ROUTES = flattenNavigation(NAVIGATION).filter((route) => route.permission !== 'home');

const renderModule = (permission, label) => {
  const Page = PAGES[permission];
  if (Page) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Page />
      </Suspense>
    );
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
