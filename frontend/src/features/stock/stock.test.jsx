import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {mockApi} from '../../test/mockApi';
import {createStockBackend} from '../../test/stockBackend';
import {previewStock, toPayload, validateIngredient, validateMovement} from './utils/stockForm';

const openPage = async () => {
  const backend = createStockBackend();
  mockApi(backend.handlers);
  const view = renderApp('/stock', {token: 't'});
  const table = await screen.findByRole('table', {name: 'Insumos'});
  await within(table).findByText('Carne de res');
  return {backend, table, ...view};
};

const rowOf = (table, name) => within(table).getByText(name).closest('tr');

describe('Gestión de stock', () => {
  it('muestra resumen, cantidades con unidad, nivel y estado', async () => {
    const {table} = await openPage();
    expect(screen.getByRole('heading', {name: 'Gestión de stock'})).toBeInTheDocument();
    const summary = screen.getByRole('region', {name: 'Resumen'});
    expect(within(summary).getByRole('button', {name: /3\s*Insumos activos/})).toHaveAttribute('aria-pressed', 'true');
    expect(within(rowOf(table, 'Carne de res')).getByLabelText('12 kg')).toBeInTheDocument();
    expect(within(rowOf(table, 'Queso cheddar')).getByText('Stock bajo')).toBeInTheDocument();
    expect(within(rowOf(table, 'Lechuga')).getByText('Sin stock')).toBeInTheDocument();
    expect(within(rowOf(table, 'Lechuga')).getByLabelText('0 unidades')).toBeInTheDocument();
    expect(within(rowOf(table, 'Aceite')).getByRole('button', {name: 'Registrar movimiento de Aceite'})).toBeDisabled();
  });

  it('las tarjetas filtran por nivel y se desactivan al tocarlas de nuevo', async () => {
    const {backend, user, location} = await openPage();
    const low = screen.getByRole('button', {name: /1\s*Con stock bajo/});
    await user.click(low);
    await waitFor(() => expect(backend.calls.list.at(-1)).toMatchObject({nivel: 'bajo'}));
    expect(location.current.search).toBe('?nivel=bajo');
    expect(screen.getByRole('button', {name: /1\s*Con stock bajo/})).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', {name: /1\s*Con stock bajo/}));
    await waitFor(() => expect(backend.calls.list.at(-1).nivel).toBe('todos'));
  });

  it('registra una entrada con vista previa del stock resultante', async () => {
    const {backend, table, user} = await openPage();
    await user.click(within(rowOf(table, 'Carne de res')).getByRole('button', {name: 'Registrar movimiento de Carne de res'}));
    const dialog = await screen.findByRole('dialog', {name: 'Registrar movimiento'});
    expect(within(dialog).getByRole('radio', {name: 'Entrada'})).toHaveAttribute('aria-checked', 'true');
    await user.type(within(dialog).getByLabelText(/^Cantidad que ingresa/), '3,5');
    expect(within(dialog).getByLabelText('15,5 kg')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/^Motivo/), 'Compra');
    await user.click(within(dialog).getByRole('button', {name: 'Registrar entrada'}));
    expect(await screen.findByText('Entrada registrada: Carne de res queda con 15,5 kg')).toBeInTheDocument();
    expect(backend.calls.movements).toEqual([{tipo: 'entrada', cantidad: 3.5, motivo: 'Compra'}]);
  });

  it('no deja registrar una salida mayor al stock y el ajuste admite cero', async () => {
    const {backend, table, user} = await openPage();
    await user.click(within(rowOf(table, 'Carne de res')).getByRole('button', {name: 'Registrar movimiento de Carne de res'}));
    const dialog = await screen.findByRole('dialog', {name: 'Registrar movimiento'});
    await user.click(within(dialog).getByRole('radio', {name: 'Salida'}));
    expect(await within(dialog).findByText(/se resta del stock/)).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/^Cantidad que sale/), '20');
    await user.click(within(dialog).getByRole('button', {name: 'Registrar salida'}));
    expect(await within(dialog).findByText('No hay suficiente stock para esa salida')).toBeInTheDocument();
    expect(backend.calls.movements).toHaveLength(0);

    await user.click(within(dialog).getByRole('radio', {name: 'Ajuste'}));
    const counted = within(dialog).getByLabelText(/^Stock contado/);
    await user.clear(counted);
    await user.type(counted, '0');
    await user.click(within(dialog).getByRole('button', {name: 'Registrar ajuste'}));
    expect(await screen.findByText('Ajuste registrado: Carne de res queda con 0 kg')).toBeInTheDocument();
  });

  it('muestra el historial con signo, responsable y stock resultante', async () => {
    const {table, user} = await openPage();
    await user.click(within(rowOf(table, 'Carne de res')).getByRole('button', {name: 'Ver historial de Carne de res'}));
    const dialog = await screen.findByRole('dialog', {name: 'Historial de movimientos'});
    const items = await within(dialog).findAllByRole('listitem');
    expect(within(items[0]).getByText('Merma')).toBeInTheDocument();
    expect(within(items[0]).getByLabelText('−0,5 kg')).toBeInTheDocument();
    expect(within(items[1]).getByLabelText('+12,5 kg')).toBeInTheDocument();
    expect(within(items[1]).getByText('Sin motivo')).toBeInTheDocument();
    expect(within(items[1]).getByText(/DIRECTORIO/)).toBeInTheDocument();
    expect(within(dialog).getByText('2 movimientos')).toBeInTheDocument();
  });

  it('registra un insumo con stock inicial', async () => {
    const {backend, user} = await openPage();
    await user.click(screen.getByRole('button', {name: 'Registrar insumo'}));
    const dialog = await screen.findByRole('dialog', {name: 'Registrar nuevo insumo'});
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await within(dialog).findByText('Seleccione la unidad de medida', {selector: 'p'})).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/^Nombre/), 'Jalapeños');
    await user.selectOptions(within(dialog).getByLabelText(/^Unidad/), 'kg');
    await user.type(within(dialog).getByLabelText(/^Stock mínimo/), '0,5');
    await user.type(within(dialog).getByLabelText(/^Stock inicial/), '2');
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await screen.findByText('Se registró el insumo Jalapeños')).toBeInTheDocument();
    expect(backend.calls.saved.at(-1)).toEqual({nombre: 'Jalapeños', unidad: 'kg', stockMinimo: 0.5, stockInicial: 2});
  });

  it('al modificar no pide stock inicial y muestra si la unidad no se puede cambiar', async () => {
    const {table, user} = await openPage();
    await user.click(within(rowOf(table, 'Carne de res')).getByRole('button', {name: 'Modificar Carne de res'}));
    const dialog = await screen.findByRole('dialog', {name: 'Modificar insumo'});
    expect(within(dialog).queryByLabelText(/^Stock inicial/)).not.toBeInTheDocument();
    await user.selectOptions(within(dialog).getByLabelText(/^Unidad/), 'g');
    await user.click(within(dialog).getByRole('button', {name: 'Guardar'}));
    expect(await within(dialog).findByText('No se puede cambiar la unidad de un insumo que ya tiene movimientos')).toBeInTheDocument();
  });

  it('valida y calcula sin la API', () => {
    expect(validateIngredient({nombre: 'X', unidad: '', stockMinimo: '1,2345', stockInicial: 'abc'}, {isEdit: false})).toEqual({
      nombre: 'Ingrese el nombre del insumo (mínimo 2 letras)',
      unidad: 'Seleccione la unidad de medida',
      stockMinimo: 'Ingrese un número válido, con hasta 3 decimales',
      stockInicial: 'Ingrese un número válido, con hasta 3 decimales',
    });
    expect(validateMovement({tipo: 'entrada', cantidad: '0'})).toEqual({cantidad: 'La cantidad debe ser mayor a 0'});
    expect(validateMovement({tipo: 'ajuste', cantidad: '0'})).toEqual({});
    expect(previewStock(1.2, {tipo: 'salida', cantidad: '0,3'})).toBe(0.9);
    expect(previewStock(5, {tipo: 'entrada', cantidad: ''})).toBeNull();
    expect(toPayload({nombre: ' Sal ', unidad: 'kg', stockMinimo: '1', stockInicial: ''}, {isEdit: false})).toEqual({nombre: 'Sal', unidad: 'kg', stockMinimo: 1});
  });
});
