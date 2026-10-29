import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {mockApi} from '../../test/mockApi';
import {createCashierBackend} from '../../test/cashierBackend';
import {resetDesktopPrinters} from '../../hooks/useDesktopPrinters';
import {documentHtml} from '../../lib/desktopPrinting';

const PRINTERS = [
  {name: 'TicketeraCocina', displayName: 'Ticketera Cocina', isDefault: false},
  {name: 'TicketeraCaja', displayName: 'Ticketera Caja', isDefault: true},
];

const stubDesktop = ({choice = {cocina: null, caja: null}, printResult} = {}) => {
  let saved = choice;
  const bridge = {
    listPrinters: vi.fn(async () => PRINTERS),
    getPrinters: vi.fn(async () => saved),
    savePrinters: vi.fn(async (next) => {
      saved = next;
      return next;
    }),
    print: vi.fn(async (job) => printResult ?? {ok: true, impresora: job.impresora ?? saved[job.destino]}),
  };
  vi.stubGlobal('brasaDesktop', bridge);
  return bridge;
};

const openCashier = async (route) => {
  const backend = createCashierBackend();
  backend.control.readyAll();
  mockApi(backend.handlers);
  const print = vi.spyOn(window, 'print').mockImplementation(() => {});
  const view = renderApp(route, {token: 't'});
  return {backend, print, ...view};
};

const sendGaseosa = async (user) => {
  await user.click(await screen.findByRole('button', {name: /^Gaseosa 500 ml,/}));
  const dialog = await screen.findByRole('dialog', {name: 'Gaseosa 500 ml'});
  await user.click(within(dialog).getByRole('button', {name: 'Agregar al pedido'}));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await user.click(screen.getByRole('button', {name: 'Enviar a cocina'}));
};

beforeEach(() => resetDesktopPrinters());
afterEach(() => resetDesktopPrinters());

describe('Impresión directa en la app de escritorio', () => {
  it('en el navegador no ofrece elegir impresoras', async () => {
    await openCashier('/caja');
    await screen.findByRole('button', {name: 'Ventas de hoy'});
    expect(screen.queryByRole('button', {name: 'Impresoras'})).not.toBeInTheDocument();
  });

  it('imprime la comanda directo en cocina al enviar, sin abrir la vista previa', async () => {
    const bridge = stubDesktop({choice: {cocina: 'TicketeraCocina', caja: null}});
    const {user, print} = await openCashier('/caja?mesa=2');
    await sendGaseosa(user);
    expect(await screen.findByText('Se envió a cocina el envío 2 del pedido Nº 7. Comanda impresa en TicketeraCocina')).toBeInTheDocument();
    expect(bridge.print).toHaveBeenCalledTimes(1);
    const job = bridge.print.mock.calls[0][0];
    expect(job.destino).toBe('cocina');
    expect(job.html).toContain('COMANDA DE COCINA');
    expect(job.html).toContain('Gaseosa 500 ml');
    expect(job.html).toContain('*** MODIFICADO POR: ADMIN ***');
    expect(screen.queryByRole('dialog', {name: 'Comanda de cocina'})).not.toBeInTheDocument();
    expect(print).not.toHaveBeenCalled();
  });

  it('si la impresora de cocina falla avisa y abre la vista previa para imprimir con el diálogo', async () => {
    stubDesktop({choice: {cocina: 'TicketeraCocina', caja: null}, printResult: {ok: false, error: 'Sin papel', impresora: 'TicketeraCocina'}});
    const {user, print} = await openCashier('/caja?mesa=2');
    await sendGaseosa(user);
    expect(await screen.findByText('Sin papel. Imprímala desde la vista previa.')).toBeInTheDocument();
    expect(screen.getByText('No se imprimió la comanda')).toBeInTheDocument();
    const dialog = await screen.findByRole('dialog', {name: 'Comanda de cocina'});
    await user.click(within(dialog).getByRole('button', {name: 'Imprimir con diálogo'}));
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
  });

  it('al cobrar imprime el ticket directo en la impresora de caja', async () => {
    const bridge = stubDesktop({choice: {cocina: null, caja: 'TicketeraCaja'}});
    const {user, print} = await openCashier('/caja?mesa=2');
    await user.click(await screen.findByRole('button', {name: 'Cobrar'}));
    const checkout = await screen.findByRole('dialog', {name: 'Cobrar Mesa 2'});
    await user.click(within(checkout).getByRole('radio', {name: 'QR'}));
    await user.click(within(checkout).getByRole('button', {name: 'Cobrar Bs 105,00'}));
    const receipt = await screen.findByRole('dialog', {name: 'Ticket de venta'});
    expect(await within(receipt).findByText('Se imprimió en TicketeraCaja')).toBeInTheDocument();
    expect(bridge.print.mock.calls[0][0]).toMatchObject({destino: 'caja'});
    expect(bridge.print.mock.calls[0][0].html).toContain('TICKET DE VENTA');
    expect(print).not.toHaveBeenCalled();
  });

  it('elige las impresoras, imprime una hoja de prueba y las guarda para esta PC', async () => {
    const bridge = stubDesktop();
    const {user} = await openCashier('/caja');
    await user.click(await screen.findByRole('button', {name: 'Impresoras'}));
    const dialog = await screen.findByRole('dialog', {name: 'Impresoras'});
    const kitchen = await within(dialog).findByLabelText('Impresora de cocina');
    expect(within(kitchen).getByRole('option', {name: 'Ticketera Caja (predeterminada)'})).toBeInTheDocument();
    await user.selectOptions(kitchen, 'TicketeraCocina');
    const testButtons = within(dialog).getAllByRole('button', {name: 'Imprimir prueba'});
    expect(testButtons[1]).toBeDisabled();
    await user.click(testButtons[0]);
    expect(await within(dialog).findByText('Se imprimió en TicketeraCocina')).toBeInTheDocument();
    expect(bridge.print.mock.calls[0][0]).toMatchObject({destino: 'cocina', impresora: 'TicketeraCocina'});
    expect(bridge.print.mock.calls[0][0].html).toContain('HOJA DE PRUEBA · COCINA');
    await user.click(within(dialog).getByRole('button', {name: 'Guardar'}));
    await waitFor(() => expect(screen.queryByRole('dialog', {name: 'Impresoras'})).not.toBeInTheDocument());
    expect(bridge.savePrinters).toHaveBeenCalledWith({cocina: 'TicketeraCocina', caja: null});
  });

  it('arma un documento con los estilos de la página dentro de la zona imprimible', async () => {
    const html = await documentHtml(<p className="font-mono">Hola</p>);
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain('<div class="print-only"><p class="font-mono">Hola</p></div>');
  });
});
