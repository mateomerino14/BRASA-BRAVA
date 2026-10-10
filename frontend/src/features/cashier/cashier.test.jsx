import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {USERS, mockApi} from '../../test/mockApi';
import {createCashierBackend} from '../../test/cashierBackend';
import {setViewport} from '../../test/viewport';
import {addLine, elapsedText, exclusionText, groupByShipment, lineKey, toOrderPayload} from './utils/cart';

const openCashier = async (route = '/caja', {user} = {}) => {
  const backend = createCashierBackend();
  const handlers = {...backend.handlers};
  if (user) {
    handlers['GET /auth/me'] = () => [200, {user}];
  }
  mockApi(handlers);
  const view = renderApp(route, {token: 't'});
  return {backend, ...view};
};

const openTable = async (name, options) => {
  const view = await openCashier('/caja', options);
  await view.user.click(await screen.findByRole('button', {name: new RegExp(`^${name},`)}));
  await screen.findByRole('region', {name: 'Pedido de la mesa'});
  return view;
};

const panel = () => screen.getByRole('region', {name: 'Pedido de la mesa'});
const menu = () => screen.getByRole('region', {name: 'Menú'});

// Toca un producto del menú, ajusta el diálogo y lo agrega al pedido
const addItem = async (user, name, {times = 0, remove = [], llevar = false, group} = {}) => {
  await user.click(within(menu()).getByRole('button', {name: new RegExp(`^${name},`)}));
  const dialog = await screen.findByRole('dialog', {name: name});
  for (let index = 0; index < times; index += 1) {
    await user.click(within(dialog).getByRole('button', {name: `Sumar cantidad de ${name}`}));
  }
  let scope = dialog;
  if (group) {
    scope = within(dialog).getByRole('group', {name: `Ingredientes de ${group}`});
  }
  for (const ingredient of remove) {
    await user.click(within(scope).getByRole('button', {name: ingredient}));
  }
  if (llevar) {
    await user.click(within(dialog).getByRole('radio', {name: 'Para llevar'}));
  }
  await user.click(within(dialog).getByRole('button', {name: 'Agregar al pedido'}));
  await waitFor(() => expect(screen.queryByRole('dialog', {name: name})).not.toBeInTheDocument());
};

describe('Caja: plano de mesas', () => {
  it('muestra el resumen y las mesas por sección con su ocupación', async () => {
    const {user, location} = await openCashier();
    expect(await screen.findByRole('heading', {name: 'Caja'})).toBeInTheDocument();
    const tables = await screen.findByRole('list', {name: 'Mesas de Salón principal'});
    const summary = screen.getByRole('region', {name: 'Resumen'});
    expect(within(summary).getByText('Mesas libres').previousSibling).toHaveTextContent('2');
    expect(within(summary).getByText('Bs por cobrar').previousSibling).toHaveTextContent('105,00');
    const busy = within(tables).getByRole('button', {name: 'Mesa 2, ocupada, Bs 105,00'});
    expect(within(busy).getByText('Carlos Mendoza')).toBeInTheDocument();
    expect(within(busy).getByText('Hace 25 min')).toBeInTheDocument();
    expect(within(busy).getByText('2 u.')).toBeInTheDocument();
    expect(within(tables).getByRole('button', {name: 'Mesa 1, libre, 4 personas'})).toBeInTheDocument();

    const sections = screen.getByRole('radiogroup', {name: 'Secciones'});
    expect(within(sections).getByRole('radio', {name: 'Salón principal, 1 mesa ocupada'})).toBeChecked();
    await user.click(within(sections).getByRole('radio', {name: 'Terraza'}));
    expect(await screen.findByRole('list', {name: 'Mesas de Terraza'})).toBeInTheDocument();
    expect(location.current.search).toBe('?seccion=2');
  });

  it('abre la mesa elegida guardándola en la dirección y vuelve al plano', async () => {
    const {user, location} = await openTable('Mesa 1');
    expect(location.current.search).toBe('?mesa=1');
    expect(screen.getByRole('heading', {name: 'Mesa 1'})).toBeInTheDocument();
    expect(within(panel()).getByRole('heading', {name: 'Nuevo pedido'})).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Mesas'}));
    expect(await screen.findByRole('list', {name: 'Mesas de Salón principal'})).toBeInTheDocument();
    expect(location.current.search).toBe('');
  });
});

describe('Caja: armado del pedido', () => {
  it('filtra el menú por categoría y búsqueda sin importar tildes', async () => {
    const {user} = await openTable('Mesa 1');
    const categories = screen.getByRole('radiogroup', {name: 'Categorías del menú'});
    await user.click(within(categories).getByRole('radio', {name: 'Promociones de hoy, 1 vigente'}));
    await waitFor(() => expect(within(menu()).getAllByRole('listitem')).toHaveLength(1));
    expect(within(menu()).getByRole('button', {name: 'Combo Brava, promoción, Bs 70,00'})).toBeInTheDocument();
    await user.click(within(categories).getByRole('radio', {name: 'Todo'}));
    await user.type(within(menu()).getByRole('searchbox'), 'clasica');
    await waitFor(() => expect(within(menu()).getAllByRole('listitem')).toHaveLength(1));
    await user.clear(within(menu()).getByRole('searchbox'));
    await user.type(within(menu()).getByRole('searchbox'), 'pizza');
    expect(await within(menu()).findByText('No hay productos que coincidan con la búsqueda.')).toBeInTheDocument();
  });

  it('marca stock bajo o agotado sin bloquear la venta y no deja elegir lo no disponible', async () => {
    await openTable('Mesa 1');
    const gaseosa = within(menu()).getByRole('button', {name: 'Gaseosa 500 ml, Bs 10,00'});
    expect(within(gaseosa).getByText('Sin stock')).toBeInTheDocument();
    expect(gaseosa).toBeEnabled();
    expect(within(within(menu()).getByRole('button', {name: 'Doble Brava, Bs 58,00'})).getByText('Quedan 3')).toBeInTheDocument();
    const cerveza = within(menu()).getByRole('button', {name: 'Cerveza Artesanal, no disponible'});
    expect(cerveza).toBeDisabled();
    expect(within(cerveza).getByText('No disponible')).toBeInTheDocument();
  });

  it('arma el pedido con cantidad, consumo e ingredientes quitados y junta las líneas iguales', async () => {
    const {user} = await openTable('Mesa 1');
    await addItem(user, 'Hamburguesa Clásica', {times: 1, remove: ['Tomate'], llevar: true});
    await addItem(user, 'Hamburguesa Clásica');
    await addItem(user, 'Hamburguesa Clásica', {remove: ['Tomate'], llevar: true});
    await addItem(user, 'Combo Brava', {remove: ['Queso cheddar'], group: 'Doble Brava'});

    const pending = within(panel()).getByRole('list', {name: 'Productos por registrar'});
    const lines = within(pending).getAllByRole('listitem');
    expect(lines).toHaveLength(3);
    expect(within(lines[0]).getByText('Sin tomate')).toBeInTheDocument();
    expect(within(lines[0]).getByText('Para llevar')).toBeInTheDocument();
    expect(within(lines[0]).getByLabelText('Cantidad de Hamburguesa Clásica')).toHaveValue('3');
    expect(within(lines[0]).getByText('Bs 105,00')).toBeInTheDocument();
    expect(within(lines[2]).getByText('Doble Brava sin queso cheddar')).toBeInTheDocument();
    expect(within(panel()).getByText('5 u.')).toBeInTheDocument();
    expect(within(panel()).getByLabelText('Bs 210,00')).toBeInTheDocument();
  });

  it('edita, cambia la cantidad y quita líneas antes de registrar', async () => {
    const {user} = await openTable('Mesa 1');
    await addItem(user, 'Doble Brava');
    await user.click(within(panel()).getByRole('button', {name: 'Editar Doble Brava'}));
    const dialog = await screen.findByRole('dialog', {name: 'Doble Brava'});
    expect(within(dialog).getByLabelText('Cantidad de Doble Brava')).toHaveValue('1');
    await user.click(within(dialog).getByRole('button', {name: 'Queso cheddar'}));
    await user.click(within(dialog).getByRole('button', {name: 'Guardar cambios'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(within(panel()).getByText('Sin queso cheddar')).toBeInTheDocument();
    await user.click(within(panel()).getByRole('button', {name: 'Sumar cantidad de Doble Brava'}));
    expect(within(within(panel()).getByRole('list', {name: 'Productos por registrar'})).getByText('Bs 116,00')).toBeInTheDocument();
    await user.click(within(panel()).getByRole('button', {name: 'Quitar Doble Brava'}));
    expect(await within(panel()).findByText('Toque un producto del menú para agregarlo.')).toBeInTheDocument();
    expect(within(panel()).getByRole('button', {name: 'Registrar pedido'})).toBeDisabled();
  });

  it('pide el mesero y abre la venta de una mesa libre', async () => {
    const {user, backend} = await openTable('Mesa 1');
    await addItem(user, 'Hamburguesa Clásica', {remove: ['Lechuga']});
    await user.click(within(panel()).getByRole('button', {name: 'Registrar pedido'}));
    expect(await within(panel()).findByText('Elija el mesero que atiende la mesa')).toBeInTheDocument();
    expect(backend.calls.orders).toHaveLength(0);

    await user.selectOptions(within(panel()).getByLabelText(/^Mesero/), 'Carlos Mendoza · Mesero');
    await user.click(within(panel()).getByRole('button', {name: 'Registrar pedido'}));
    expect(await screen.findByText('Se abrió Mesa 1 con el pedido Nº 8')).toBeInTheDocument();
    expect(backend.calls.orders[0]).toEqual({idMesa: 1, body: {idMesero: 1, items: [{tipo: 'producto', id: 11, cantidad: 1, consumo: 'local', exclusiones: [{idProducto: 11, idInsumo: 5}]}]}});
    expect(within(panel()).getByRole('heading', {name: 'Pedido Nº 8'})).toBeInTheDocument();
    expect(within(panel()).getByText('Toque un producto del menú para agregarlo.')).toBeInTheDocument();
    await user.click(within(panel()).getByRole('button', {name: /Registrado/}));
    expect(within(panel()).getByText('Sin lechuga')).toBeInTheDocument();
  });

  it('suma un envío a la mesa ocupada con su mesero y muestra lo ya registrado', async () => {
    const {user, backend} = await openTable('Mesa 2');
    expect(within(panel()).getByRole('heading', {name: 'Pedido Nº 7'})).toBeInTheDocument();
    expect(within(panel()).getByLabelText(/^Mesero/)).toHaveValue('1');
    const toggle = within(panel()).getByRole('button', {name: /Registrado/});
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveTextContent('1 envío · 2 u.');
    await user.click(toggle);
    expect(within(panel()).getByText(/^Envío 1 · \d{2}:\d{2} · Carlos Mendoza$/)).toBeInTheDocument();
    expect(within(panel()).getByText('Sin tomate')).toBeInTheDocument();

    await addItem(user, 'Gaseosa 500 ml', {times: 1});
    expect(within(panel()).getByLabelText('Bs 125,00')).toBeInTheDocument();
    await user.click(within(panel()).getByRole('button', {name: 'Registrar pedido'}));
    expect(await screen.findByText('Se sumó el envío 2 al pedido Nº 7')).toBeInTheDocument();
    expect(backend.calls.orders[0].idMesa).toBe(2);
    expect(within(panel()).getByText(/^Envío 2 · /)).toBeInTheDocument();
  });

  it('elige al usuario de la sesión como mesero si atiende mesas', async () => {
    await openTable('Mesa 1', {user: USERS.cajero});
    expect(within(panel()).getByLabelText(/^Mesero/)).toHaveValue('2');
  });

  it('muestra el error del servidor y conserva lo que faltaba registrar', async () => {
    const {user, backend} = await openTable('Mesa 2');
    backend.control.orderError = 'Gaseosa 500 ml no está disponible por ahora';
    await addItem(user, 'Gaseosa 500 ml');
    await user.click(within(panel()).getByRole('button', {name: 'Registrar pedido'}));
    expect(await within(panel()).findByText('Gaseosa 500 ml no está disponible por ahora')).toBeInTheDocument();
    expect(within(within(panel()).getByRole('list', {name: 'Productos por registrar'})).getAllByRole('listitem')).toHaveLength(1);
  });

  it('avisa antes de salir con productos sin registrar', async () => {
    const {user, location} = await openTable('Mesa 1');
    await addItem(user, 'Gaseosa 500 ml');
    await user.click(screen.getByRole('button', {name: 'Mesas'}));
    const dialog = await screen.findByRole('dialog', {name: 'Descartar productos'});
    expect(within(dialog).getByText(/Hay 1 productos sin registrar en Mesa 1/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Cancelar'}));
    expect(location.current.search).toBe('?mesa=1');
    await user.click(screen.getByRole('button', {name: 'Mesas'}));
    await user.click(await screen.findByRole('button', {name: 'Descartar y salir'}));
    await waitFor(() => expect(location.current.search).toBe(''));
  });

  it('en celular muestra el pedido desde una barra inferior', async () => {
    setViewport(390);
    const {user} = await openCashier('/caja?mesa=1');
    await screen.findByRole('region', {name: 'Menú'});
    expect(screen.queryByRole('region', {name: 'Pedido de la mesa'})).not.toBeInTheDocument();
    await addItem(user, 'Gaseosa 500 ml');
    await user.click(screen.getByRole('button', {name: /Ver pedido · 1 por registrar/}));
    const dialog = await screen.findByRole('dialog', {name: 'Nuevo pedido'});
    expect(within(dialog).getByText('Mesa 1 · Salón principal')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', {name: 'Registrar pedido'})).toBeEnabled();
  });
});

describe('Caja: utilidades del pedido', () => {
  const tomate = {idProducto: 11, producto: 'Hamburguesa Clásica', idInsumo: 4, insumo: 'Tomate'};
  const lechuga = {idProducto: 11, producto: 'Hamburguesa Clásica', idInsumo: 5, insumo: 'Lechuga'};
  const base = {tipo: 'producto', id: 11, nombre: 'Hamburguesa Clásica', precio: 35, cantidad: 2, consumo: 'local', exclusiones: []};

  it('considera iguales las líneas con los mismos ingredientes quitados en cualquier orden', () => {
    expect(lineKey({...base, exclusiones: [tomate, lechuga]})).toBe(lineKey({...base, exclusiones: [lechuga, tomate]}));
    expect(lineKey({...base, consumo: 'llevar'})).not.toBe(lineKey(base));
  });

  it('junta líneas iguales sin pasar del máximo', () => {
    const once = addLine([], base, 99);
    const twice = addLine(once, {...base, cantidad: 98}, 99);
    expect(twice).toHaveLength(1);
    expect(twice[0].cantidad).toBe(99);
    expect(addLine(twice, {...base, exclusiones: [tomate]}, 99)).toHaveLength(2);
  });

  it('describe los ingredientes quitados de un producto o de un combo', () => {
    expect(exclusionText([tomate, lechuga])).toBe('Sin tomate, lechuga');
    expect(exclusionText([{idProducto: 12, producto: 'Doble Brava', idInsumo: 3, insumo: 'Queso cheddar'}, tomate], {combo: true})).toBe('Doble Brava sin queso cheddar · Hamburguesa Clásica sin tomate');
    expect(exclusionText([])).toBe('');
  });

  it('arma el cuerpo del envío y agrupa lo registrado por envío', () => {
    expect(toOrderPayload('3', [{...base, key: 'k', exclusiones: [tomate]}])).toEqual({idMesero: 3, items: [{tipo: 'producto', id: 11, cantidad: 2, consumo: 'local', exclusiones: [{idProducto: 11, idInsumo: 4}]}]});
    const mesero = {id: 1, nombre: 'Carlos Mendoza'};
    const groups = groupByShipment([{id: 1, envio: 1, mesero, creadoEn: 'a'}, {id: 2, envio: 2, mesero, creadoEn: 'b'}, {id: 3, envio: 1, mesero, creadoEn: 'a'}]);
    expect(groups.map((group) => [group.envio, group.detalles.map((item) => item.id)])).toEqual([[1, [1, 3]], [2, [2]]]);
  });

  it('describe el tiempo que lleva abierta una mesa', () => {
    const now = new Date('2026-10-13T20:00:00Z').getTime();
    expect(elapsedText('2026-10-13T19:59:40Z', now)).toBe('Recién');
    expect(elapsedText('2026-10-13T19:35:00Z', now)).toBe('Hace 25 min');
    expect(elapsedText('2026-10-13T18:00:00Z', now)).toBe('Hace 2 h');
    expect(elapsedText('2026-10-13T18:55:00Z', now)).toBe('Hace 1 h 5 min');
  });
});
