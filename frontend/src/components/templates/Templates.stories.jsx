import {fn} from 'storybook/test';
import {MainLayout} from './MainLayout';
import {AuthLayout} from './AuthLayout';
import {NAVIGATION, filterNavigation} from '../../config/navigation';

export default {title: 'Plantillas', parameters: {layout: 'fullscreen'}};

export const Panel = {
  render: () => (
    <MainLayout
      sidebarItems={filterNavigation(NAVIGATION, [
        'home',
        'familia',
        'caja',
        'productos',
        'stock',
        'empleados',
      ])}
      user={{alias: 'admin', nombre: 'Marco Vargas', cargo: 'Administrador'}}
      title="Página principal"
      onLogout={fn()}
      onToggleCollapsed={fn()}
      pageKey="/"
    >
      <p className="rounded-3xl bg-crema p-10 text-center font-accent text-4xl">Contenido de la pantalla</p>
    </MainLayout>
  ),
};

export const SinSesion = {
  render: () => (
    <AuthLayout>
      <p className="py-20 text-center font-display text-5xl">Contenido del login</p>
    </AuthLayout>
  ),
};
