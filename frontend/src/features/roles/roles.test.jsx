import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {USERS, mockApi} from '../../test/mockApi';
import {createRolesBackend} from '../../test/rolesBackend';
import {toPayload, validateRole} from './utils/roleForm';

const openPage = async () => {
  const backend = createRolesBackend();
  mockApi(backend.handlers);
  const view = renderApp('/cargos', {token: 't'});
  const table = await screen.findByRole('table', {name: 'Cargos'});
  await within(table).findByText('Mesero');
  return {backend, table, ...view};
};

const rowOf = (table, name) => within(table).getByText(name, {selector: 'p'}).closest('tr');

describe('Gestión de cargos', () => {
  it('muestra las pantallas de cada cargo, empleados y estado', async () => {
    const {table} = await openPage();
    expect(screen.getByRole('heading', {name: 'Gestión de cargos'})).toBeInTheDocument();
    const mesero = rowOf(table, 'Mesero');
    const screens = within(mesero).getByRole('list', {name: 'Pantallas de Mesero'});
    expect(within(screens).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Familia', 'Caja']);
    expect(within(mesero).getByLabelText('2 empleados')).toBeInTheDocument();
    const admin = within(rowOf(table, 'Administrador')).getByRole('list', {name: 'Pantallas de Administrador'});
    expect(within(admin).getByRole('button', {name: '+7 más'})).toBeInTheDocument();
    expect(within(rowOf(table, 'Delivery')).getByText('Inactivo')).toBeInTheDocument();
  });

  it('valida y registra un cargo marcando pantallas por grupo y una por una', async () => {
    const {backend, user} = await openPage();
    await user.click(screen.getByRole('button', {name: 'Registrar cargo'}));
    const dialog = await screen.findByRole('dialog', {name: 'Registrar nuevo cargo'});
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(within(dialog).getByText('Ingrese el nombre del cargo (mínimo 2 letras)')).toBeInTheDocument();
    expect(within(dialog).getByText('Marque al menos una pantalla')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/^Nombre del cargo/), 'Bartender');
    const group = within(dialog).getByRole('group', {name: /Pantallas que puede ver/});
    await user.click(within(group).getAllByRole('button', {name: 'Marcar todas'})[0]);
    expect(within(group).getByRole('checkbox', {name: /^Caja/})).toBeChecked();
    await user.click(within(group).getByRole('checkbox', {name: /Inventario/}));
    expect(within(dialog).getByText('marcadas', {exact: false})).toHaveTextContent('3 de 10 marcadas');
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));

    expect(await screen.findByText('Se registró el cargo Bartender')).toBeInTheDocument();
    expect(backend.calls.saved[0]).toEqual({nombre: 'Bartender', pantallas: ['familia', 'caja', 'stock']});
  });

  it('modifica un cargo con sus pantallas precargadas y avisa a quiénes afecta', async () => {
    const {backend, table, user} = await openPage();
    await user.click(within(table).getByRole('button', {name: 'Modificar Mesero'}));
    const dialog = await screen.findByRole('dialog', {name: 'Modificar cargo'});
    expect(within(dialog).getByRole('checkbox', {name: /^Caja/})).toBeChecked();
    expect(within(dialog).getByText(/afecta a 2 empleados/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('checkbox', {name: /Inventario/}));
    await user.click(within(dialog).getByRole('button', {name: 'Guardar'}));
    expect(await screen.findByText('Se actualizó el cargo Mesero')).toBeInTheDocument();
    expect(backend.calls.saved[0].pantallas).toEqual(['familia', 'caja', 'stock']);
  });

  it('muestra el aviso del servidor si el cargo tiene empleados y reactiva uno de baja', async () => {
    const {table, user} = await openPage();
    await user.click(within(table).getByRole('button', {name: 'Dar de baja Mesero'}));
    await user.click(within(await screen.findByRole('dialog', {name: 'Dar de baja cargo'})).getByRole('button', {name: 'Dar de baja'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('2 empleados activos tienen este cargo');
    await user.click(screen.getByRole('button', {name: 'Cancelar'}));
    await user.click(within(table).getByRole('button', {name: 'Reactivar Delivery'}));
    await user.click(within(await screen.findByRole('dialog', {name: 'Reactivar cargo'})).getByRole('button', {name: 'Reactivar'}));
    expect(await screen.findByText('Se reactivó el cargo Delivery')).toBeInTheDocument();
  });

  it('el cajero no puede entrar a la gestión de cargos', async () => {
    mockApi({'GET /auth/me': () => [200, {user: USERS.cajero}]});
    renderApp('/cargos', {token: 't'});
    expect(await screen.findByRole('heading', {name: 'Página principal'})).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('link', {name: /Cargos/})).not.toBeInTheDocument());
  });
});

describe('roleForm', () => {
  it('valida el nombre y exige al menos una pantalla', () => {
    expect(Object.keys(validateRole({nombre: 'B', pantallas: []})).sort()).toEqual(['nombre', 'pantallas']);
    expect(validateRole({nombre: 'Bartender', pantallas: ['caja']})).toEqual({});
  });

  it('envía las pantallas en el orden del menú', () => {
    expect(toPayload({nombre: ' Bar ', pantallas: ['cargos', 'caja', 'familia']})).toEqual({nombre: 'Bar', pantallas: ['familia', 'caja', 'cargos']});
  });
});
