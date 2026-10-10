import {describe, expect, it, vi} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {USERS, mockApi} from '../../test/mockApi';
import {createCashierBackend} from '../../test/cashierBackend';
import {buildCheckout, cashSuggestions, receiptLines} from './utils/checkout';

// Recorre cobro, resumen, reimpresión y edición del enlace: necesita más que los 5 s por defecto
const LONG_TEST_MS = 20000;

const openMesa2 = async ({ready = true, user} = {}) => {
  const backend = createCashierBackend();
  if (ready) {
    backend.control.readyAll();
  }
  const handlers = {...backend.handlers};
  if (user) {
    handlers['GET /auth/me'] = () => [200, {user}];
  }
  mockApi(handlers);
  const print = vi.spyOn(window, 'print').mockImplementation(() => {});
  const view = renderApp('/caja?mesa=2', {token: 't'});
  await screen.findByRole('region', {name: 'Pedido de la mesa'});
  return {backend, print, ...view};
};

const panel = () => screen.getByRole('region', {name: 'Pedido de la mesa'});

const openCheckout = async (user) => {
  await user.click(within(panel()).getByRole('button', {name: 'Cobrar'}));
  return screen.findByRole('dialog', {name: 'Cobrar Mesa 2'});
};

describe('Caja: cobro', () => {
  it('no deja cobrar mientras cocina tenga unidades sin terminar', async () => {
    await openMesa2({ready: false});
    expect(within(panel()).getByText('Cocina tiene 1 unidad por terminar.')).toBeInTheDocument();
    expect(within(panel()).getByRole('button', {name: 'Cobrar'})).toBeDisabled();
  });

  it('no deja cobrar con productos sin enviar a cocina', async () => {
    const {user} = await openMesa2();
    await user.click(screen.getByRole('button', {name: /^Gaseosa 500 ml,/}));
    const dialog = await screen.findByRole('dialog', {name: 'Gaseosa 500 ml'});
    await user.click(within(dialog).getByRole('button', {name: 'Agregar al pedido'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(within(panel()).getByText('Envíe a cocina o quite lo que falta registrar antes de cobrar.')).toBeInTheDocument();
    expect(within(panel()).getByRole('button', {name: 'Cobrar'})).toBeDisabled();
  });

  it('cobra en efectivo con cambio, imprime el ticket solo y vuelve a las mesas', async () => {
    const {user, backend, print, location} = await openMesa2();
    const dialog = await openCheckout(user);
    const preview = within(dialog).getByRole('region', {name: 'Vista previa del ticket'});
    expect(within(preview).getByText('Bs 105,00')).toBeInTheDocument();
    expect(within(preview).getByText('Combo Brava')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Bs 110,00'}));
    expect(within(dialog).getByLabelText('Bs 5,00')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Cobrar Bs 105,00'}));

    const receipt = await screen.findByRole('dialog', {name: 'Ticket de venta'});
    expect(backend.calls.checkouts[0]).toEqual({idMesa: 2, body: {pagos: [{metodo: 'efectivo', monto: 105}], recibido: 110}});
    const ticket = within(receipt).getByRole('article', {name: 'Ticket del pedido 7'});
    expect(within(ticket).getByText('Recibido').nextSibling).toHaveTextContent('Bs 110,00');
    expect(within(ticket).getByText('Cambio').nextSibling).toHaveTextContent('Bs 5,00');
    expect(print).toHaveBeenCalledTimes(1);
    await user.click(within(receipt).getByRole('button', {name: 'Listo'}));
    await waitFor(() => expect(location.current.search).toBe(''));
    expect(await screen.findByRole('button', {name: 'Mesa 2, libre, 4 personas'})).toBeInTheDocument();
  });

  it('valida el efectivo recibido y arma el pago mixto con la parte por QR', async () => {
    const {user, backend} = await openMesa2();
    const dialog = await openCheckout(user);
    await user.type(within(dialog).getByLabelText('Efectivo recibido'), '50');
    await user.click(within(dialog).getByRole('button', {name: 'Cobrar Bs 105,00'}));
    expect(await within(dialog).findByText('No alcanza: faltan Bs 55,00')).toBeInTheDocument();
    expect(backend.calls.checkouts).toHaveLength(0);

    await user.click(within(dialog).getByRole('radio', {name: 'Mixto'}));
    await user.type(within(dialog).getByLabelText(/^Parte en efectivo/), '200');
    await user.click(within(dialog).getByRole('button', {name: 'Cobrar Bs 105,00'}));
    expect(await within(dialog).findByText('El efectivo debe ser mayor a 0 y menor que Bs 105,00')).toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText(/^Parte en efectivo/));
    await user.type(within(dialog).getByLabelText(/^Parte en efectivo/), '60,50');
    expect(within(dialog).getByText('Parte por QR').nextSibling).toHaveTextContent('Bs 44,50');
    await user.click(within(dialog).getByRole('button', {name: 'Cobrar Bs 105,00'}));
    await screen.findByRole('dialog', {name: 'Ticket de venta'});
    expect(backend.calls.checkouts[0].body).toEqual({pagos: [{metodo: 'efectivo', monto: 60.5}, {metodo: 'qr', monto: 44.5}], recibido: null});
  });

  it('cobra por QR y muestra el error del servidor sin cerrar el cobro', async () => {
    const {user, backend} = await openMesa2();
    backend.control.checkoutError = 'Faltan 1 unidades por marcar como listas en cocina';
    const dialog = await openCheckout(user);
    await user.click(within(dialog).getByRole('radio', {name: 'QR'}));
    expect(within(dialog).queryByLabelText('Efectivo recibido')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('link', {name: 'Página de impuestos'})).toHaveAttribute('href', 'https://siat.impuestos.gob.bo/v2/launcher/');
    await user.click(within(dialog).getByRole('button', {name: 'Cobrar Bs 105,00'}));
    expect(await within(dialog).findByText('Faltan 1 unidades por marcar como listas en cocina')).toBeInTheDocument();
    expect(backend.calls.checkouts[0].body).toEqual({pagos: [{metodo: 'qr', monto: 105}]});
  });

  it('resume las ventas de hoy, reimprime el ticket y deja cambiar el enlace a Administración', async () => {
    const admin = {...USERS.admin, permissions: [...USERS.admin.permissions, 'administracion']};
    const {user, backend} = await openMesa2({user: admin});
    const dialog = await openCheckout(user);
    await user.click(within(dialog).getByRole('radio', {name: 'QR'}));
    await user.click(within(dialog).getByRole('button', {name: 'Cobrar Bs 105,00'}));
    const receipt = await screen.findByRole('dialog', {name: 'Ticket de venta'});
    await user.click(within(receipt).getByRole('button', {name: 'Listo'}));

    await user.click(await screen.findByRole('button', {name: 'Ventas de hoy'}));
    const today = await screen.findByRole('dialog', {name: 'Ventas de hoy'});
    expect(await within(today).findByText('Nº 7 · Mesa 2')).toBeInTheDocument();
    const totals = within(today).getByRole('region', {name: 'Totales del día'});
    expect(within(totals).getByText('QR Bs').nextSibling).toHaveTextContent('105,00');
    await user.click(within(today).getByRole('button', {name: 'Reimprimir el ticket del pedido 7'}));
    const reprint = await screen.findByRole('dialog', {name: 'Ticket de venta'});
    expect(within(reprint).getByRole('article', {name: 'Ticket del pedido 7'})).toBeInTheDocument();
    await user.click(within(reprint).getByRole('button', {name: 'Listo'}));

    await user.click(within(today).getByRole('button', {name: 'Cambiar el enlace de impuestos'}));
    const field = within(today).getByLabelText('Enlace de la página de impuestos');
    await user.clear(field);
    await user.type(field, 'siat');
    await user.click(within(today).getByRole('button', {name: 'Guardar enlace'}));
    expect(await within(today).findByText('Ingrese un enlace que empiece con http:// o https://')).toBeInTheDocument();
    await user.clear(field);
    await user.type(field, 'https://siat.impuestos.gob.bo/nuevo');
    await user.click(within(today).getByRole('button', {name: 'Guardar enlace'}));
    expect(await within(today).findByRole('link', {name: 'Página de impuestos'})).toHaveAttribute('href', 'https://siat.impuestos.gob.bo/nuevo');
    expect(backend.calls.settings.at(-1)).toEqual({enlaceImpuestos: 'https://siat.impuestos.gob.bo/nuevo'});
  }, LONG_TEST_MS);

  it('sin Administración no se puede cambiar el enlace', async () => {
    mockApi(createCashierBackend().handlers);
    const {user} = renderApp('/caja', {token: 't'});
    await user.click(await screen.findByRole('button', {name: 'Ventas de hoy'}));
    const today = await screen.findByRole('dialog', {name: 'Ventas de hoy'});
    expect(await within(today).findByText('Todavía no se cobró ninguna venta hoy.')).toBeInTheDocument();
    expect(within(today).queryByRole('button', {name: 'Cambiar el enlace de impuestos'})).not.toBeInTheDocument();
  });
});

describe('Caja: utilidades del cobro', () => {
  it('sugiere el exacto y billetes redondos que cubren el total', () => {
    expect(cashSuggestions(105)).toEqual([105, 110, 120, 150]);
    expect(cashSuggestions(200)).toEqual([200]);
  });

  it('arma los pagos y el cambio según el método', () => {
    expect(buildCheckout({metodo: 'efectivo', recibido: '', efectivo: ''}, 50)).toEqual({errors: {}, cambio: 0, payload: {pagos: [{metodo: 'efectivo', monto: 50}], recibido: null}});
    expect(buildCheckout({metodo: 'efectivo', recibido: '100', efectivo: ''}, 50).cambio).toBe(50);
    expect(buildCheckout({metodo: 'efectivo', recibido: 'abc', efectivo: ''}, 50).errors).toEqual({recibido: 'Ingrese un monto válido'});
    expect(buildCheckout({metodo: 'qr', recibido: '', efectivo: ''}, 50).payload).toEqual({pagos: [{metodo: 'qr', monto: 50}]});
    expect(buildCheckout({metodo: 'mixto', recibido: '30', efectivo: '20,5'}, 50)).toEqual({errors: {}, cambio: 9.5, payload: {pagos: [{metodo: 'efectivo', monto: 20.5}, {metodo: 'qr', monto: 29.5}], recibido: 30}});
  });

  it('junta en el ticket las líneas con el mismo producto, precio y consumo', () => {
    const line = (nombre, cantidad, consumo = 'local') => ({nombre, precioUnitario: 35, cantidad, consumo});
    expect(receiptLines([line('Clásica', 1), line('Clásica', 2), line('Clásica', 1, 'llevar')])).toEqual([
      {nombre: 'Clásica', consumo: 'local', precioUnitario: 35, cantidad: 3, subtotal: 105},
      {nombre: 'Clásica', consumo: 'llevar', precioUnitario: 35, cantidad: 1, subtotal: 35},
    ]);
  });
});
