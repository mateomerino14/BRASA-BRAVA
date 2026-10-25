import {describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router';
import {MotionConfig} from 'motion/react';
import {Sidebar} from './Sidebar';
import {Modal} from './Modal';
import {Footer} from './Footer';
import {NAVIGATION, filterNavigation, flattenNavigation} from '../../config/navigation';

const renderSidebar = (permissions, route = '/') =>
  render(
    <MotionConfig reducedMotion="always">
      <MemoryRouter initialEntries={[route]}>
        <Sidebar items={filterNavigation(NAVIGATION, permissions)} onToggleCollapsed={() => {}} />
      </MemoryRouter>
    </MotionConfig>,
  );

describe('navegación', () => {
  it('filtra por permisos y oculta grupos vacíos', () => {
    const items = filterNavigation(NAVIGATION, ['home', 'caja']);
    expect(items.map((item) => item.label)).toEqual(['Home', 'Caja']);
  });

  it('mantiene el grupo con los hijos permitidos', () => {
    const items = filterNavigation(NAVIGATION, ['home', 'stock']);
    const group = items.find((item) => item.children);
    expect(group.children.map((child) => child.label)).toEqual(['Inventario']);
  });

  it('aplana todas las rutas', () => {
    expect(flattenNavigation(NAVIGATION)).toHaveLength(10);
  });
});

describe('Sidebar', () => {
  it('despliega y contrae el grupo Administración', async () => {
    renderSidebar(['home', 'productos', 'stock']);
    const toggle = screen.getByRole('button', {name: 'Administración'});
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', {name: 'Inventario'})).not.toBeInTheDocument();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', {name: 'Inventario'})).toBeInTheDocument();
    await userEvent.click(toggle);
    await waitFor(() =>
      expect(screen.queryByRole('link', {name: 'Inventario'})).not.toBeInTheDocument(),
    );
  });

  it('abre el grupo y marca activo el ítem de la ruta actual', () => {
    renderSidebar(['home', 'stock'], '/inventario');
    expect(screen.getByRole('button', {name: 'Administración'})).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('link', {name: 'Inventario'})).toHaveAttribute('aria-current', 'page');
  });

  it('no muestra módulos sin permiso', () => {
    renderSidebar(['home', 'caja']);
    expect(screen.queryByRole('button', {name: 'Administración'})).not.toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Caja'})).toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('se cierra con Escape y no tiene X arriba (cada modal trae su Cerrar o Cancelar)', async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Recuperar contraseña">
        <input aria-label="Correo" />
      </Modal>,
    );
    expect(screen.getByRole('dialog', {name: 'Recuperar contraseña'})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Cerrar'})).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('no renderiza nada cerrado', () => {
    render(<Modal open={false} title="Oculto" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Footer', () => {
  it('enlaza las redes sociales del local en una pestaña nueva', () => {
    render(<Footer />);
    const links = {
      'Facebook de Brasa Brava': 'https://www.facebook.com/BrasaBravaTiquipaya/?locale=es_LA',
      'Instagram de Brasa Brava': 'https://www.instagram.com/brasabrava_tiquipaya/',
      'TikTok de Brasa Brava': 'https://www.tiktok.com/@brasa.brava.tiqui',
    };
    for (const [name, href] of Object.entries(links)) {
      const link = screen.getByRole('link', {name});
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });
});
