import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {mockApi} from '../../test/mockApi';
import {setViewport} from '../../test/viewport';
import {createEmployeesBackend} from '../../test/employeesBackend';

const TABLET_WIDTH = 820;

const openEmployees = async (route = '/empleados') => {
  const backend = createEmployeesBackend();
  mockApi(backend.handlers);
  const view = renderApp(route, {token: 't'});
  await screen.findByText('Gestión de empleados');
  return {backend, ...view};
};

const params = (location) => Object.fromEntries(new URLSearchParams(location.current.search));

describe('Pantallas de gestión estándar', () => {
  it('si la lista no carga avisa en emergente y la tabla ofrece reintentar', async () => {
    const backend = createEmployeesBackend();
    let failures = 1;
    const list = backend.handlers['GET /employees'];
    mockApi({...backend.handlers, 'GET /employees': (...args) => {
      if (failures > 0) {
        failures -= 1;
        return [500, {message: 'No se pudo conectar con la base de datos'}];
      }
      return list(...args);
    }});
    const {user} = renderApp('/empleados', {token: 't'});
    const toast = await screen.findByRole('alert');
    expect(toast).toHaveTextContent('No se pudo cargar la lista');
    expect(toast).toHaveTextContent('No se pudo conectar con la base de datos');
    const table = screen.getByRole('table');
    expect(within(table).getByText('No se pudo cargar la lista')).toBeInTheDocument();
    expect(within(table).queryByText(/No se encontraron/)).not.toBeInTheDocument();
    await user.click(within(table).getByRole('button', {name: 'Reintentar'}));
    expect(await within(table).findAllByRole('row')).not.toHaveLength(1);
    expect(within(table).queryByText('No se pudo cargar la lista')).not.toBeInTheDocument();
  });

  it('lee búsqueda, filtros y página desde la URL', async () => {
    const {backend} = await openEmployees('/empleados?search=ortiz&estado=inactivos&pageSize=10');
    await waitFor(() => expect(backend.calls.at(-1)).toMatchObject({search: 'ortiz', estado: 'inactivos', page: '1', pageSize: '10'}));
    expect(screen.getByRole('searchbox')).toHaveValue('ortiz');
    expect(screen.getByLabelText('Filtrar por estado')).toHaveValue('inactivos');
    expect(screen.getByLabelText('Filas por página')).toHaveValue('10');
  });

  it('guarda búsqueda y filtros en la URL y vuelve a la página 1', async () => {
    const {user, location} = await openEmployees('/empleados?page=2');
    await user.type(screen.getByRole('searchbox'), 'carlos');
    await waitFor(() => expect(params(location)).toEqual({search: 'carlos'}));
    await user.selectOptions(screen.getByLabelText('Filtrar por cargo'), 'Mesero');
    expect(params(location)).toEqual({search: 'carlos', idCargo: '4'});
  });

  it('ordena tocando el encabezado: ascendente, descendente y por defecto', async () => {
    const {backend, user, location} = await openEmployees();
    const table = await screen.findByRole('table', {name: 'Empleados'});
    const header = within(table).getByRole('button', {name: 'Empleado'});
    await user.click(header);
    await waitFor(() => expect(backend.calls.at(-1)).toMatchObject({sort: 'nombre', dir: 'asc'}));
    expect(header.closest('th')).toHaveAttribute('aria-sort', 'ascending');
    await user.click(header);
    await waitFor(() => expect(backend.calls.at(-1)).toMatchObject({sort: 'nombre', dir: 'desc'}));
    expect(header.closest('th')).toHaveAttribute('aria-sort', 'descending');
    await user.click(header);
    await waitFor(() => expect(backend.calls.at(-1).sort).toBeUndefined());
    expect(params(location)).toEqual({});
  });

  it('cambia la cantidad de filas por página', async () => {
    const {backend, user} = await openEmployees('/empleados?page=3');
    await user.selectOptions(screen.getByLabelText('Filas por página'), '20');
    await waitFor(() => expect(backend.calls.at(-1)).toMatchObject({pageSize: '20', page: '1'}));
  });

  it('ofrece limpiar filtros cuando no hay resultados', async () => {
    const {user, location} = await openEmployees('/empleados?search=zzz&estado=inactivos&sort=ci');
    expect(await screen.findByText('No se encontraron empleados con esos filtros')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Limpiar filtros'}));
    expect(await screen.findByText('Andrea Romero')).toBeInTheDocument();
    expect(params(location)).toEqual({sort: 'ci'});
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('en tarjetas el orden se elige en una lista', async () => {
    setViewport(TABLET_WIDTH);
    const {backend, user} = await openEmployees();
    await screen.findByRole('list', {name: 'Empleados'});
    await user.selectOptions(screen.getByLabelText('Ordenar por'), 'cargo:desc');
    await waitFor(() => expect(backend.calls.at(-1)).toMatchObject({sort: 'cargo', dir: 'desc'}));
    await user.selectOptions(screen.getByLabelText('Ordenar por'), '');
    await waitFor(() => expect(backend.calls.at(-1).sort).toBeUndefined());
  });
});
