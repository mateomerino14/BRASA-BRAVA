import {describe, expect, it} from 'vitest';
import {screen, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {mockApi} from '../../test/mockApi';
import {createStockBackend} from '../../test/stockBackend';
import {toFormValues, toPayload, validateIngredient} from './utils/stockForm';

const openPage = async () => {
  const backend = createStockBackend();
  mockApi(backend.handlers);
  const view = renderApp('/inventario', {token: 't'});
  const table = await screen.findByRole('table', {name: 'Insumos'});
  await within(table).findByText('Carne de res');
  return {backend, table, ...view};
};

const rowOf = (table, name) => within(table).getByText(name).closest('tr');

describe('Inventario', () => {
  it('muestra cada insumo con su cantidad pintada por nivel, el mínimo y el estado', async () => {
    const {table} = await openPage();
    expect(screen.getByRole('heading', {name: 'Inventario de insumos'})).toBeInTheDocument();
    expect(screen.queryByRole('region', {name: 'Resumen'})).not.toBeInTheDocument();
    expect(within(rowOf(table, 'Carne de res')).getByLabelText('12 kg')).toBeInTheDocument();
    expect(within(rowOf(table, 'Carne de res')).getByText('5 kg')).toBeInTheDocument();
    expect(within(rowOf(table, 'Queso cheddar')).getByText('1,5')).toHaveClass('text-brasa-oscuro');
    expect(within(rowOf(table, 'Lechuga')).getByText('0')).toHaveClass('text-error');
    expect(within(rowOf(table, 'Aceite')).getByText('Inactivo')).toBeInTheDocument();
    expect(within(rowOf(table, 'Carne de res')).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual(['Modificar Carne de res', 'Dar de baja Carne de res']);
  });

  it('registra un insumo con la cantidad que hay hoy', async () => {
    const {backend, user} = await openPage();
    await user.click(screen.getByRole('button', {name: 'Registrar insumo'}));
    const dialog = await screen.findByRole('dialog', {name: 'Registrar nuevo insumo'});
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await within(dialog).findByText('Seleccione la unidad de medida', {selector: 'p'})).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/^Nombre/), 'Jalapeños');
    await user.selectOptions(within(dialog).getByLabelText(/^Unidad/), 'kg');
    await user.type(within(dialog).getByLabelText(/^Cantidad en stock/), '2');
    await user.type(within(dialog).getByLabelText(/^Stock mínimo/), '0,5');
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await screen.findByRole('status')).toHaveTextContent('Se registró el insumo Jalapeños');
    expect(backend.calls.saved.at(-1)).toEqual({nombre: 'Jalapeños', unidad: 'kg', stockMinimo: 0.5, stockInicial: 2});
  });

  it('al modificar corrige la cantidad y avisa en emergente si el servidor rechaza', async () => {
    const {backend, table, user} = await openPage();
    await user.click(within(rowOf(table, 'Carne de res')).getByRole('button', {name: 'Modificar Carne de res'}));
    const dialog = await screen.findByRole('dialog', {name: 'Modificar insumo'});
    const quantity = within(dialog).getByLabelText(/^Cantidad en stock/);
    expect(quantity).toHaveValue('12');
    await user.selectOptions(within(dialog).getByLabelText(/^Unidad/), 'g');
    await user.click(within(dialog).getByRole('button', {name: 'Guardar'}));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No se pudo guardar');
    expect(alert).toHaveTextContent('No se puede cambiar la unidad de un insumo que ya tiene movimientos');
    expect(dialog).toBeInTheDocument();

    await user.selectOptions(within(dialog).getByLabelText(/^Unidad/), 'kg');
    await user.clear(quantity);
    await user.type(quantity, '4,5');
    await user.click(within(dialog).getByRole('button', {name: 'Guardar'}));
    expect(await screen.findByRole('status')).toHaveTextContent('Se actualizó el insumo Carne de res');
    expect(backend.calls.saved.at(-1)).toEqual({nombre: 'Carne de res', unidad: 'kg', stockMinimo: 5, stockActual: 4.5});
    expect(await within(rowOf(table, 'Carne de res')).findByText('4,5')).toHaveClass('text-brasa-oscuro');
  });

  it('valida y arma el pedido sin la API', () => {
    expect(validateIngredient({nombre: 'X', unidad: '', stockActual: 'abc', stockMinimo: '1,2345'}, {isEdit: false})).toEqual({
      nombre: 'Ingrese el nombre del insumo (mínimo 2 letras)',
      unidad: 'Seleccione la unidad de medida',
      stockActual: 'Ingrese un número válido, con hasta 3 decimales',
      stockMinimo: 'Ingrese un número válido, con hasta 3 decimales',
    });
    expect(validateIngredient({nombre: 'Sal', unidad: 'kg', stockActual: '', stockMinimo: '1'}, {isEdit: true})).toEqual({stockActual: 'Ingrese la cantidad en stock'});
    expect(toPayload({nombre: ' Sal ', unidad: 'kg', stockActual: '', stockMinimo: '1'}, {isEdit: false})).toEqual({nombre: 'Sal', unidad: 'kg', stockMinimo: 1});
    expect(toFormValues({nombre: 'Sal', unidad: 'kg', stockActual: 1.25, stockMinimo: 0.5})).toEqual({nombre: 'Sal', unidad: 'kg', stockActual: '1,25', stockMinimo: '0,5'});
  });
});
