import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {USERS, mockApi} from '../../test/mockApi';
import {createEmployeesBackend} from '../../test/employeesBackend';
import {validateEmployee} from './utils/validateEmployee';

const openPage = async () => {
  const backend = createEmployeesBackend();
  mockApi(backend.handlers);
  const view = renderApp('/empleados', {token: 't'});
  const table = await screen.findByRole('table', {name: 'Empleados'});
  await within(table).findByText('Andrea Romero');
  return {backend, table, ...view};
};

const fillField = async (user, dialog, label, value) => {
  const input = within(dialog).getByLabelText(new RegExp(`^${label}`));
  await user.clear(input);
  await user.type(input, value);
};

describe('Gestión de empleados', () => {
  it('muestra la tabla con estado, cargo y acciones', async () => {
    const {table} = await openPage();
    expect(screen.getByRole('heading', {name: 'Gestión de empleados'})).toBeInTheDocument();
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(4);
    expect(within(rows[3]).getByText('Inhabilitado')).toBeInTheDocument();
    expect(within(rows[3]).getByRole('button', {name: 'Reactivar a Javier Ortiz'})).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–3 de 3 empleados')).toBeInTheDocument();
  });

  it('filtra por búsqueda, cargo y estado', async () => {
    const {backend, table, user} = await openPage();
    await user.type(screen.getByRole('searchbox'), 'ortiz');
    await waitFor(() => expect(within(table).queryByText('Andrea Romero')).not.toBeInTheDocument());
    expect(backend.calls.at(-1)).toMatchObject({search: 'ortiz', page: '1'});
    await user.clear(screen.getByRole('searchbox'));
    await user.selectOptions(screen.getByLabelText('Filtrar por cargo'), 'Mesero');
    await waitFor(() => expect(backend.calls.at(-1)).toMatchObject({idCargo: '4'}));
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'inactivos');
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(2));
  });

  it('valida el formulario antes de enviar y registra un empleado con su foto', async () => {
    const {backend, user} = await openPage();
    await user.click(screen.getByRole('button', {name: 'Registrar empleado'}));
    const dialog = await screen.findByRole('dialog', {name: 'Registrar nuevo empleado'});
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(within(dialog).getByText('Ingrese el nombre')).toBeInTheDocument();
    expect(within(dialog).getByText('Seleccione un cargo', {selector: 'p'})).toBeInTheDocument();

    await fillField(user, dialog, 'Nombre', 'Lucía');
    await fillField(user, dialog, 'Apellido', 'Flores');
    await fillField(user, dialog, 'CI', '7123456 CB');
    await fillField(user, dialog, 'Usuario', 'L.Flores');
    await fillField(user, dialog, 'Correo', 'l.flores@brasabrava.bo');
    await user.selectOptions(within(dialog).getByLabelText(/^Cargo/), 'Cajero');
    await fillField(user, dialog, 'Contraseña inicial', 'Inicial2026');
    expect(within(dialog).getByText('Lucía Flores')).toBeInTheDocument();
    await user.upload(within(dialog).getByLabelText('Foto del empleado', {selector: 'input'}), new File([new Uint8Array(64)], 'lucia.png', {type: 'image/png'}));
    expect(within(dialog).getByRole('img', {name: 'Lucía Flores'}).getAttribute('src')).toMatch(/^blob:/);
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));

    expect(await screen.findByText('Se registró a Lucía Flores')).toBeInTheDocument();
    expect(backend.images.uploads[0].file.name).toBe('lucia.png');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('l.flores')).toBeInTheDocument();
  });

  it('muestra en el modal el error del servidor', async () => {
    const {user} = await openPage();
    await user.click(screen.getByRole('button', {name: 'Registrar empleado'}));
    const dialog = await screen.findByRole('dialog');
    await fillField(user, dialog, 'Nombre', 'Otra');
    await fillField(user, dialog, 'Apellido', 'Persona');
    await fillField(user, dialog, 'CI', '1234567');
    await fillField(user, dialog, 'Usuario', 'a.romero');
    await fillField(user, dialog, 'Correo', 'otra@brasabrava.bo');
    await user.selectOptions(within(dialog).getByLabelText(/^Cargo/), 'Cajero');
    await fillField(user, dialog, 'Contraseña inicial', 'Inicial2026');
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Ese nombre de usuario ya está en uso');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('modifica un empleado con los datos precargados', async () => {
    const {backend, user} = await openPage();
    await user.click(screen.getByRole('button', {name: 'Modificar a Carlos Mendoza'}));
    const dialog = await screen.findByRole('dialog', {name: 'Modificar empleado'});
    expect(within(dialog).getByLabelText(/^CI/)).toHaveValue('4920114 LP');
    expect(within(dialog).getByLabelText(/^Cargo/)).toHaveValue('4');
    expect(within(dialog).getByRole('img', {name: 'Vista previa de foto del empleado'})).toHaveAttribute('src', '/uploads/carlos.png');
    await fillField(user, dialog, 'Nombre', 'Carlos Andrés');
    await user.click(within(dialog).getByRole('button', {name: 'Quitar'}));
    await user.click(within(dialog).getByRole('button', {name: 'Guardar'}));
    expect(await screen.findByText('Se actualizaron los datos de Carlos Andrés Mendoza')).toBeInTheDocument();
    expect(backend.images.removals).toEqual([1]);
    expect(backend.store.find((employee) => employee.id === 1).contrasena).toBe('');
  });

  it('da de baja con confirmación', async () => {
    const {table, user} = await openPage();
    await user.click(within(table).getByRole('button', {name: 'Dar de baja a Andrea Romero'}));
    const dialog = await screen.findByRole('dialog', {name: 'Dar de baja'});
    expect(dialog).toHaveTextContent('Andrea Romero ya no podrá iniciar sesión');
    await user.click(within(dialog).getByRole('button', {name: 'Dar de baja'}));
    expect(await screen.findByText('Se dio de baja a Andrea Romero')).toBeInTheDocument();
    expect(await within(table).findByRole('button', {name: 'Reactivar a Andrea Romero'})).toBeInTheDocument();
  });

  it('el cajero no puede entrar a la gestión de empleados', async () => {
    mockApi({'GET /auth/me': () => [200, {user: USERS.cajero}]});
    renderApp('/empleados', {token: 't'});
    expect(await screen.findByRole('heading', {name: 'Página principal'})).toBeInTheDocument();
  });
});

describe('validateEmployee', () => {
  const valid = {
    nombre: 'Ana',
    apellido: 'Paz',
    ci: '1234567 LP',
    telefono: '',
    alias: 'a.paz',
    correo: 'a@b.bo',
    idCargo: '2',
    contrasena: 'Clave1234',
  };

  it('acepta datos válidos', () => {
    expect(validateEmployee(valid, {isEdit: false})).toEqual({});
  });

  it('en modificación la contraseña es opcional', () => {
    expect(validateEmployee({...valid, contrasena: ''}, {isEdit: true})).toEqual({});
    expect(validateEmployee({...valid, contrasena: ''}, {isEdit: false})).toHaveProperty('contrasena');
  });

  it('rechaza CI, teléfono y usuario con formato inválido', () => {
    const errors = validateEmployee({...valid, ci: 'abc', telefono: '12', alias: 'A B'}, {isEdit: false});
    expect(Object.keys(errors).sort()).toEqual(['alias', 'ci', 'telefono']);
  });
});
