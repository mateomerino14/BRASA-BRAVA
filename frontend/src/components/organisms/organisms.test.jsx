import {describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router';
import {MotionConfig} from 'motion/react';
import {Sidebar} from './Sidebar';
import {Modal} from './Modal';
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
    expect(group.children.map((child) => child.label)).toEqual(['Stock']);
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
    expect(screen.queryByRole('link', {name: 'Stock'})).not.toBeInTheDocument();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', {name: 'Stock'})).toBeInTheDocument();
    await userEvent.click(toggle);
    await waitFor(() =>
      expect(screen.queryByRole('link', {name: 'Stock'})).not.toBeInTheDocument(),
    );
  });

  it('abre el grupo y marca activo el ítem de la ruta actual', () => {
    renderSidebar(['home', 'stock'], '/stock');
    expect(screen.getByRole('button', {name: 'Administración'})).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('link', {name: 'Stock'})).toHaveAttribute('aria-current', 'page');
  });

  it('no muestra módulos sin permiso', () => {
    renderSidebar(['home', 'caja']);
    expect(screen.queryByRole('button', {name: 'Administración'})).not.toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Caja'})).toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('se cierra con Escape y con el botón', async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Recuperar contraseña">
        <input aria-label="Correo" />
      </Modal>,
    );
    expect(screen.getByRole('dialog', {name: 'Recuperar contraseña'})).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', {name: 'Cerrar'}));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('no renderiza nada cerrado', () => {
    render(<Modal open={false} title="Oculto" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
