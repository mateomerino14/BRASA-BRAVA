import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {USERS, mockApi} from '../../test/mockApi';
import {createReportsBackend} from '../../test/reportsBackend';
import {daysText, periodShortcuts} from './utils/reports';

const openReports = async ({user} = {}) => {
  const backend = createReportsBackend();
  const handlers = {...backend.handlers};
  if (user) {
    handlers['GET /auth/me'] = () => [200, {user}];
  }
  mockApi(handlers);
  const view = renderApp('/reportes', {token: 't'});
  await screen.findByRole('region', {name: 'Totales del período'});
  return {backend, ...view};
};

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

beforeEach(() => {
  vi.stubGlobal('URL', Object.assign(URL, {createObjectURL: vi.fn(() => 'blob:reporte'), revokeObjectURL: vi.fn()}));
});
afterEach(() => vi.restoreAllMocks());

describe('Reportes de ventas', () => {
  it('abre con el resumen de hoy: totales y una fila por día', async () => {
    const {backend} = await openReports();
    expect(screen.getByRole('link', {name: 'Reportes'})).toBeInTheDocument();
    expect(backend.calls.reports[0]).toEqual({desde: today(), hasta: today(), empleado: 'todos', tipo: 'resumen'});
    const totals = screen.getByRole('region', {name: 'Totales del período'});
    expect(within(totals).getByText('Ventas').nextSibling).toHaveTextContent('2');
    expect(within(totals).getByText('Total Bs').nextSibling).toHaveTextContent('253,00');
    const table = screen.getByRole('table', {name: 'Ventas por día'});
    expect(within(table).getByText('Mar 20/10/2026')).toBeInTheDocument();
    expect(within(table).getByText('Total del período')).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Envíos programados'})).not.toBeInTheDocument();
  });

  it('cambia a ventas detalladas y abre el detalle de una venta en una ventana', async () => {
    const {user} = await openReports();
    await user.click(screen.getByRole('radio', {name: 'Ventas detalladas'}));
    const table = await screen.findByRole('table', {name: 'Ventas cobradas'});
    expect(within(table).getByText('Mesa 1 · Salón principal')).toBeInTheDocument();
    await user.click(within(table).getByRole('button', {name: 'Ver la venta 41'}));
    const dialog = await screen.findByRole('dialog', {name: 'Venta Nº 41 · Bs 195,00'});
    const second = within(dialog).getByRole('region', {name: 'Envío 2'});
    expect(within(second).getByText(/Registró: admin/)).toBeInTheDocument();
    expect(within(second).getByText('Para llevar')).toBeInTheDocument();
    expect(within(dialog).getByText('Doble Brava sin queso cheddar')).toBeInTheDocument();
    const payment = within(dialog).getByRole('complementary', {name: 'Cobro'});
    expect(payment).toHaveTextContent('Ticket impreso 4 veces · la 4.ª la autorizó Carlos Mendoza');
    expect(within(dialog).getByRole('button', {name: 'Reimprimir ticket'})).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Cerrar'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('filtra por empleado y por atajos de período', async () => {
    const {user, backend} = await openReports();
    const employee = screen.getByLabelText('Empleado');
    expect(within(employee).getByRole('option', {name: 'Jorge Quispe (j.quispe) · de baja'})).toBeInTheDocument();
    await user.selectOptions(employee, 'Andrea Romero (a.romero)');
    await user.click(screen.getByRole('button', {name: 'Este mes'}));
    await user.click(screen.getByRole('button', {name: 'Generar'}));
    await waitFor(() => expect(backend.calls.reports).toHaveLength(2));
    expect(backend.calls.reports[1]).toMatchObject({empleado: '2', desde: `${today().slice(0, 8)}01`, hasta: today()});
    expect(await screen.findByText(/Andrea Romero$/)).toBeInTheDocument();
  });

  it('descarga el PDF y lo envía al correo escrito', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const {user, backend} = await openReports();
    await user.click(screen.getByRole('button', {name: 'Descargar PDF'}));
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(backend.calls.pdfs[0]).toMatchObject({tipo: 'resumen', desde: today()});
    const form = screen.getByRole('form', {name: 'Descargar o enviar el reporte'});
    await user.click(within(form).getByRole('button', {name: 'Enviar por correo'}));
    expect(await within(form).findByText('Ingrese un correo válido')).toBeInTheDocument();
    expect(backend.calls.emails).toHaveLength(0);
    await user.type(within(form).getByLabelText('Enviar a este correo'), 'Gerencia@BrasaBrava.bo');
    await user.click(within(form).getByRole('button', {name: 'Enviar por correo'}));
    expect(await screen.findByText('Se envió el reporte a gerencia@brasabrava.bo')).toBeInTheDocument();
    expect(backend.calls.emails[0]).toMatchObject({correo: 'Gerencia@BrasaBrava.bo', tipo: 'resumen'});
  });

  it('el DIRECTORIO programa, pausa, envía ahora y borra envíos', async () => {
    const {user, backend} = await openReports({user: USERS.directorio});
    await user.click(screen.getByRole('button', {name: 'Envíos programados'}));
    const dialog = await screen.findByRole('dialog', {name: 'Envíos programados'});
    const list = await within(dialog).findByRole('list', {name: 'Envíos programados'});
    expect(within(list).getByText('Resumen de ventas · Lunes y jueves a las 8:00 AM')).toBeInTheDocument();
    expect(within(list).getByText(/Enviado al encender/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', {name: 'Nuevo envío'}));
    const form = await screen.findByRole('dialog', {name: 'Nuevo envío programado'});
    await user.click(within(form).getByRole('button', {name: 'Guardar'}));
    expect(await within(form).findByText('Ingrese un correo válido')).toBeInTheDocument();
    await user.type(within(form).getByLabelText(/^Correo de destino/), 'contador@estudio.bo');
    await user.selectOptions(within(form).getByLabelText('Reporte'), 'Ventas detalladas');
    await user.click(within(form).getByRole('button', {name: 'Guardar'}));
    expect(await screen.findByText('Se programó el envío a contador@estudio.bo')).toBeInTheDocument();
    expect(backend.calls.schedules[0]).toEqual({create: {correo: 'contador@estudio.bo', tipo: 'detalle', dias: '0100100', hora: '08:00'}});

    await user.click(within(list).getByRole('switch', {name: 'Envío a gerencia@brasabrava.bo activo'}));
    expect(await screen.findByText('Se pausó el envío a gerencia@brasabrava.bo')).toBeInTheDocument();
    expect(within(list).getByText(/pausado/)).toBeInTheDocument();
    await user.click(within(list).getByRole('button', {name: 'Enviar ahora a gerencia@brasabrava.bo'}));
    expect(await screen.findByText('Se envió el reporte a gerencia@brasabrava.bo')).toBeInTheDocument();
    await user.click(within(list).getByRole('button', {name: 'Borrar el envío a contador@estudio.bo'}));
    await user.click(within(await screen.findByRole('dialog', {name: 'Borrar envío programado'})).getByRole('button', {name: 'Borrar'}));
    await waitFor(() => expect(within(list).queryByText('contador@estudio.bo')).not.toBeInTheDocument());
  }, 20000);

  it('describe los días y arma los atajos de período', () => {
    expect(daysText('1111111')).toBe('Todos los días');
    expect(daysText('0100100')).toBe('Lunes y jueves');
    expect(daysText('1010100')).toBe('Martes, jueves y domingo');
    const [hoy, ayer, semana, mes] = periodShortcuts(new Date(2026, 9, 22));
    expect([hoy.desde, ayer.desde, semana.desde, mes.desde]).toEqual(['2026-10-22', '2026-10-21', '2026-10-19', '2026-10-01']);
  });
});
