import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {mockApi} from '../../test/mockApi';
import {createSectionsBackend} from '../../test/sectionsBackend';
import {nextTableName, toPayload, validateSection} from './utils/sectionForm';

const openPage = async () => {
  const backend = createSectionsBackend();
  mockApi(backend.handlers);
  const view = renderApp('/secciones', {token: 't'});
  const table = await screen.findByRole('table', {name: 'Secciones'});
  await within(table).findByText('Salón principal');
  return {backend, table, ...view};
};

const rowOf = (table, name) => within(table).getByText(name, {selector: 'p'}).closest('tr');

describe('Gestión de secciones y mesas', () => {
  it('muestra resumen, mesas desplegables, totales y estado', async () => {
    const {table, user} = await openPage();
    expect(screen.getByRole('heading', {name: 'Gestión de secciones y mesas'})).toBeInTheDocument();
    const summary = screen.getByRole('region', {name: 'Resumen'});
    expect(within(summary).getByText('Mesas disponibles')).toBeInTheDocument();
    const salon = rowOf(table, 'Salón principal');
    expect(within(salon).getByLabelText('6 mesas')).toBeInTheDocument();
    expect(within(salon).getByLabelText('24 personas')).toBeInTheDocument();
    const chips = within(salon).getByRole('list', {name: 'Mesas de Salón principal'});
    expect(within(chips).queryByText('Mesa 6 · 4')).not.toBeInTheDocument();
    await user.click(within(chips).getByRole('button', {name: '+2 más'}));
    expect(within(chips).getByText('Mesa 6 · 4')).toBeInTheDocument();
    expect(within(rowOf(table, 'Salón VIP')).getByText('Inactiva')).toBeInTheDocument();
  });

  it('registra una sección agregando mesas numeradas con su capacidad', async () => {
    const {backend, user} = await openPage();
    await user.click(screen.getByRole('button', {name: 'Registrar sección'}));
    const dialog = await screen.findByRole('dialog', {name: 'Registrar nueva sección'});
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await within(dialog).findByText('Agregue al menos una mesa')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/^Nombre/), 'Patio');
    await user.click(within(dialog).getByRole('button', {name: 'Agregar mesa'}));
    expect(within(dialog).getByLabelText('Nombre de la mesa 1')).toHaveValue('Mesa 1');
    const first = within(dialog).getByLabelText('Nombre de la mesa 1');
    await user.clear(first);
    await user.type(first, 'P1');
    await user.click(within(dialog).getByRole('button', {name: 'Sumar capacidad de P1'}));
    await user.click(within(dialog).getByRole('button', {name: 'Sumar capacidad de P1'}));
    await user.click(within(dialog).getByRole('button', {name: 'Agregar mesa'}));
    // La nueva sigue la numeración y copia la capacidad de la anterior
    expect(within(dialog).getByLabelText('Nombre de la mesa 2')).toHaveValue('P2');
    expect(within(dialog).getByLabelText('Capacidad de P2')).toHaveValue('6');
    expect(within(dialog).getByText('2 mesas · 12 personas')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));

    expect(await screen.findByText('Se registró la sección Patio con 2 mesas')).toBeInTheDocument();
    expect(backend.calls.saved.at(-1)).toEqual({nombre: 'Patio', descripcion: '', mesas: [{nombre: 'P1', capacidad: 6}, {nombre: 'P2', capacidad: 6}]});
  });

  it('marca la mesa repetida y el nombre de sección duplicado', async () => {
    const {user} = await openPage();
    await user.click(screen.getByRole('button', {name: 'Registrar sección'}));
    const dialog = await screen.findByRole('dialog', {name: 'Registrar nueva sección'});
    await user.type(within(dialog).getByLabelText(/^Nombre/), 'terraza');
    await user.click(within(dialog).getByRole('button', {name: 'Agregar mesa'}));
    await user.click(within(dialog).getByRole('button', {name: 'Agregar mesa'}));
    const second = within(dialog).getByLabelText('Nombre de la mesa 2');
    await user.clear(second);
    await user.type(second, 'mesa 1');
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(within(dialog).getByText('Ya hay una mesa con ese nombre')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Quitar mesa 1'}));
    await waitFor(() => expect(within(dialog).queryByText('Ya hay una mesa con ese nombre')).not.toBeInTheDocument());
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await within(dialog).findByText('Ya existe una sección con ese nombre')).toBeInTheDocument();
  });

  it('modifica mesas conservando sus ids', async () => {
    const {backend, table, user} = await openPage();
    await user.click(within(rowOf(table, 'Terraza')).getByRole('button', {name: 'Modificar Terraza'}));
    const dialog = await screen.findByRole('dialog', {name: 'Modificar sección'});
    await user.click(within(dialog).getByRole('button', {name: 'Restar capacidad de Terraza 1'}));
    await user.click(within(dialog).getByRole('button', {name: 'Quitar Terraza 2'}));
    await user.click(within(dialog).getByRole('button', {name: 'Agregar mesa'}));
    await user.click(within(dialog).getByRole('button', {name: 'Guardar'}));
    expect(await screen.findByText('Se actualizó la sección Terraza')).toBeInTheDocument();
    expect(backend.calls.saved.at(-1).mesas).toEqual([{id: 20, nombre: 'Terraza 1', capacidad: 3}, {nombre: 'Terraza 2', capacidad: 3}]);
  });

  it('confirma antes de dar de baja', async () => {
    const {table, user} = await openPage();
    await user.click(within(rowOf(table, 'Salón principal')).getByRole('button', {name: 'Dar de baja Salón principal'}));
    const dialog = await screen.findByRole('dialog', {name: 'Dar de baja sección'});
    expect(within(dialog).getByText(/sus 6 mesas dejarán de aparecer en caja/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Dar de baja'}));
    expect(await screen.findByText('Se dio de baja la sección Salón principal')).toBeInTheDocument();
    await waitFor(() => expect(within(rowOf(table, 'Salón principal')).getByText('Inactiva')).toBeInTheDocument());
  });

  it('propone nombres y valida sin la API', () => {
    expect(nextTableName([])).toBe('Mesa 1');
    expect(nextTableName([{nombre: 'Terraza 4'}])).toBe('Terraza 5');
    expect(nextTableName([{nombre: 'B1'}, {nombre: 'B2'}])).toBe('B3');
    expect(nextTableName([{nombre: 'Barra'}])).toBe('Mesa 1');
    expect(validateSection({nombre: 'X', mesas: []})).toEqual({nombre: 'Ingrese el nombre de la sección (mínimo 2 letras)', mesas: 'Agregue al menos una mesa'});
    expect(toPayload({nombre: ' Patio ', descripcion: '', mesas: [{key: 'a', nombre: ' P1 ', capacidad: 4}]})).toEqual({nombre: 'Patio', descripcion: '', mesas: [{id: undefined, nombre: 'P1', capacidad: 4}]});
  });
});
