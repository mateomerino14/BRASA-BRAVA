import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {USERS, mockApi} from '../../test/mockApi';
import {LiveClock} from '../../components/molecules/LiveClock';

describe('Home', () => {
  it('saluda por el nombre y muestra accesos de todos los módulos al administrador', async () => {
    mockApi();
    renderApp('/', {token: 't'});
    expect(
      await screen.findByRole('heading', {name: /Bienvenido de vuelta, Marco/}),
    ).toBeInTheDocument();
    const shortcuts = screen.getByRole('region', {name: 'Accesos rápidos'});
    expect(shortcuts.querySelectorAll('a')).toHaveLength(8);
  });

  it('el cajero solo ve sus módulos y no entra a pantallas sin permiso', async () => {
    mockApi({'GET /auth/me': () => [200, {user: USERS.cajero}]});
    renderApp('/empleados', {token: 't'});
    expect(await screen.findByRole('heading', {name: 'Página principal'})).toBeInTheDocument();
    const shortcuts = screen.getByRole('region', {name: 'Accesos rápidos'});
    expect([...shortcuts.querySelectorAll('a')].map((link) => link.getAttribute('href'))).toEqual([
      '/familia',
      '/caja',
    ]);
    expect(screen.queryByRole('button', {name: 'Administración'})).not.toBeInTheDocument();
  });

  it('muestra "en construcción" en módulos pendientes', async () => {
    mockApi();
    renderApp('/caja', {token: 't'});
    expect(
      await screen.findByRole('heading', {name: 'Caja en construcción'}),
    ).toBeInTheDocument();
  });

  it('cerrar sesión borra el token y vuelve al login', async () => {
    mockApi();
    const {user} = renderApp('/', {token: 't'});
    await user.click(await screen.findByRole('button', {name: 'Cerrar sesión'}));
    expect(await screen.findByRole('heading', {name: 'Inicio de sesión'})).toBeInTheDocument();
    expect(localStorage.getItem('brasa.token')).toBeNull();
  });

  it('el reloj avanza cada segundo', async () => {
    vi.useFakeTimers({toFake: ['setInterval', 'clearInterval', 'Date']});
    vi.setSystemTime(new Date(2026, 9, 9, 13, 45, 0));
    render(<LiveClock />);
    expect(screen.getByText('13:45:00')).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(2000);
    expect(screen.getByText('13:45:02')).toBeInTheDocument();
  });

  it('una ruta desconocida muestra 404', () => {
    mockApi();
    renderApp('/no-existe');
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});
