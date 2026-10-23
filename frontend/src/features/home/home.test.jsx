import {describe, expect, it, vi} from 'vitest';
import {render, screen, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {USERS, mockApi} from '../../test/mockApi';
import {LiveClock} from '../../components/molecules/LiveClock';
import {MotionConfig} from 'motion/react';
import {WelcomeCard} from './components/WelcomeCard';

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

const SUMMARY_HANDLERS = {
  'GET /sales/floor': () => [200, {secciones: [], summary: {mesas: 18, ocupadas: 2, libres: 16, porCobrar: 263}}],
  'GET /sales/today': () => [200, {hoy: '2026-10-15', ventas: [], resumen: {cantidad: 3, total: 412.5, efectivo: 300, qr: 112.5}}],
  'GET /kitchen/orders': () => [200, {
    envios: [{id: '7-1', estado: 'preparacion', mesa: 'Mesa 2', creadoEn: minutesAgo(25)}],
    summary: {preparacion: 1, listos: 2, unidadesPendientes: 5},
  }],
};

const COCINERO = {...USERS.cajero, id: 3, alias: 'r.sanchez', nombre: 'Roberto Sánchez', cargo: 'Cocinero', permissions: ['home', 'familia', 'cocina']};

describe('Home', () => {
  it('el administrador ve el resumen de caja y de cocina del día', async () => {
    mockApi(SUMMARY_HANDLERS);
    renderApp('/', {token: 't'});
    const summary = await screen.findByRole('region', {name: 'Resumen de hoy'});
    const cashier = await within(summary).findByRole('group', {name: 'Caja'});
    expect(within(cashier).getByText('vendido en 3 ventas')).toBeInTheDocument();
    expect(within(cashier).getByLabelText('Bs 412,50')).toBeInTheDocument();
    expect(within(cashier).getByLabelText('Bs 300,00')).toBeInTheDocument();
    expect(within(cashier).getByLabelText('2 de 18 mesas')).toBeInTheDocument();
    expect(within(cashier).getByText('ocupadas, Bs 263,00 por cobrar')).toBeInTheDocument();
    const kitchen = within(summary).getByRole('group', {name: 'Cocina'});
    expect(within(kitchen).getByText('unidades por preparar')).toBeInTheDocument();
    expect(within(kitchen).getByLabelText('25 min')).toBeInTheDocument();
    expect(within(kitchen).getByText('espera más larga, Mesa 2')).toBeInTheDocument();
    expect(within(cashier).getByRole('link', {name: 'Abrir caja'})).toHaveAttribute('href', '/caja');
    expect(within(kitchen).getByRole('link', {name: 'Abrir cocina'})).toHaveAttribute('href', '/cocina');
  });

  it('cada cargo ve solo el resumen de lo suyo', async () => {
    const fetchMock = mockApi({...SUMMARY_HANDLERS, 'GET /auth/me': () => [200, {user: COCINERO}]});
    renderApp('/', {token: 't'});
    const summary = await screen.findByRole('region', {name: 'Resumen de hoy'});
    expect(await within(summary).findByText('envío en preparación')).toBeInTheDocument();
    expect(within(summary).queryByRole('group', {name: 'Caja'})).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => url.includes('/sales/'))).toBe(false);
  });

  it('avisa si el resumen no se pudo cargar', async () => {
    mockApi({...SUMMARY_HANDLERS, 'GET /sales/today': () => [500, {message: 'Error interno del servidor'}], 'GET /auth/me': () => [200, {user: USERS.cajero}]});
    renderApp('/', {token: 't'});
    expect(await screen.findByText(/No se pudo cargar el resumen/)).toBeInTheDocument();
  });

  it('saluda por el nombre y muestra accesos de todos los módulos al administrador', async () => {
    mockApi();
    renderApp('/', {token: 't'});
    expect(
      await screen.findByRole('heading', {name: /^(Buenos días|Buenas tardes|Buenas noches), Marco$/}),
    ).toBeInTheDocument();
    const shortcuts = screen.getByRole('region', {name: 'Accesos rápidos'});
    expect(shortcuts.querySelectorAll('a')).toHaveLength(10);
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

  it('cerrar sesión borra el token y vuelve al login', async () => {
    mockApi();
    const {user} = renderApp('/', {token: 't'});
    await user.click(await screen.findByRole('button', {name: 'Cerrar sesión'}));
    expect(await screen.findByRole('heading', {name: 'Inicio de sesión'})).toBeInTheDocument();
    expect(localStorage.getItem('brasa.token')).toBeNull();
  });

  it('muestra el video del local mudo y en bucle', () => {
    const {container} = render(<MotionConfig reducedMotion="never"><WelcomeCard name="Marco Vargas" clockDate={new Date(2026, 9, 15, 10, 47)} /></MotionConfig>);
    const video = container.querySelector('video');
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
    expect(screen.getByText('10:47')).toBeInTheDocument();
  });

  it('con animaciones reducidas muestra una foto fija del local', () => {
    const {container} = render(<MotionConfig reducedMotion="always"><WelcomeCard name="Marco Vargas" clockDate={new Date(2026, 9, 15, 10, 47)} /></MotionConfig>);
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('img')).toBeInTheDocument();
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
