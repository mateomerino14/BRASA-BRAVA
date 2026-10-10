import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {mockApi} from '../../test/mockApi';
import {createPromotionsBackend} from '../../test/promotionsBackend';
import {previewPricing, toPayload, validatePromotion} from './utils/promotionForm';

const openPage = async () => {
  const backend = createPromotionsBackend();
  mockApi(backend.handlers);
  const view = renderApp('/promociones', {token: 't'});
  const table = await screen.findByRole('table', {name: 'Promociones'});
  await within(table).findByText('Combo Brava');
  return {backend, table, ...view};
};

const rowOf = (table, name) => within(table).getByText(name, {selector: 'p'}).closest('tr');

const openCreate = async (user) => {
  await user.click(screen.getByRole('button', {name: 'Registrar promoción'}));
  return screen.findByRole('dialog', {name: 'Registrar nueva promoción'});
};

describe('Gestión de promociones', () => {
  it('muestra vigencia, días, fechas y precio regular frente al de promoción', async () => {
    const {table} = await openPage();
    expect(screen.getByRole('heading', {name: 'Gestión de promociones'})).toBeInTheDocument();
    const combo = rowOf(table, 'Combo Brava');
    expect(within(combo).getByText('Vigente hoy')).toBeInTheDocument();
    expect(within(combo).getByText('3 oct 2026 – 9 nov 2026')).toBeInTheDocument();
    expect(within(combo).getByText('Todos los días')).toBeInTheDocument();
    expect(within(combo).getByLabelText('Precio regular Bs 83,00')).toBeInTheDocument();
    expect(within(combo).getByLabelText('Bs 70,00')).toBeInTheDocument();
    expect(within(combo).getByText('−16%')).toBeInTheDocument();
    const martes = rowOf(table, 'Martes de Hamburguesas');
    expect(within(martes).getByText('Hoy no aplica')).toBeInTheDocument();
    expect(within(martes).getByText('Martes')).toBeInTheDocument();
    expect(within(martes).getByText('Desde 10 sept 2026')).toBeInTheDocument();
  });

  it('las tarjetas filtran por vigencia', async () => {
    const {backend, user} = await openPage();
    await user.click(screen.getByRole('button', {name: /1\s*Vigentes hoy/}));
    await waitFor(() => expect(backend.calls.list.at(-1)).toMatchObject({vigencia: 'vigentes'}));
  });

  it('arma un combo con cantidades, calcula el precio y avisa si no es más barato', async () => {
    const {backend, user} = await openPage();
    const dialog = await openCreate(user);
    expect(within(dialog).getByLabelText(/^Desde/)).toHaveValue('2026-10-10');
    await user.type(within(dialog).getByLabelText(/^Nombre/), 'Combo Familiar');
    await user.click(within(dialog).getByRole('button', {name: 'Agregar producto'}));
    await user.selectOptions(within(dialog).getByLabelText('Producto 1'), 'Doble Brava — Bs 58,00');
    await user.click(within(dialog).getByRole('button', {name: 'Sumar cantidad de Doble Brava'}));
    await user.click(within(dialog).getByRole('button', {name: 'Agregar producto'}));
    await user.selectOptions(within(dialog).getByLabelText('Producto 2'), 'Gaseosa 500 ml — Bs 10,00');
    expect(within(dialog).getByText('Por separado: Bs 126,00')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/^Precio del combo/), '130');
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await within(dialog).findByText('El precio del combo debe ser menor que comprar los productos por separado')).toBeInTheDocument();
    const price = within(dialog).getByLabelText(/^Precio del combo/);
    await user.clear(price);
    await user.type(price, '110');
    expect(within(dialog).getByText('Ahorra Bs 16,00')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await screen.findByText('Se registró la promoción Combo Familiar')).toBeInTheDocument();
    expect(backend.calls.saved.at(-1)).toEqual({
      nombre: 'Combo Familiar', descripcion: '', tipo: 'combo', valor: 110, fechaInicio: '2026-10-10', fechaFin: '', dias: '1111111',
      productos: [{idProducto: 1, cantidad: 2}, {idProducto: 3, cantidad: 1}],
    });
  });

  it('arma un descuento por días y valida porcentaje y días', async () => {
    const {backend, user} = await openPage();
    const dialog = await openCreate(user);
    await user.type(within(dialog).getByLabelText(/^Nombre/), 'Viernes de Papas');
    await user.click(within(dialog).getByRole('radio', {name: 'Descuento %'}));
    await user.type(within(dialog).getByLabelText(/^Porcentaje de descuento/), '95');
    await user.click(within(dialog).getByRole('button', {name: 'Agregar producto'}));
    await user.selectOptions(within(dialog).getByLabelText('Producto 1'), 'Papas Fritas Clásicas — Bs 15,00');
    expect(within(dialog).queryByRole('button', {name: /Sumar cantidad/})).not.toBeInTheDocument();
    for (const day of ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']) {
      await user.click(within(dialog).getByRole('button', {name: day}));
    }
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await within(dialog).findByText('El descuento debe ser un porcentaje entero de 1 a 90')).toBeInTheDocument();
    expect(within(dialog).getByText('Elija al menos un día de la semana')).toBeInTheDocument();
    const percent = within(dialog).getByLabelText(/^Porcentaje de descuento/);
    await user.clear(percent);
    await user.type(percent, '20');
    await user.click(within(dialog).getByRole('button', {name: 'Viernes'}));
    expect(within(dialog).getByLabelText('Bs 12,00')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await screen.findByText('Se registró la promoción Viernes de Papas')).toBeInTheDocument();
    expect(backend.calls.saved.at(-1)).toMatchObject({tipo: 'descuento', valor: 20, dias: '0000010', productos: [{idProducto: 2, cantidad: 1}]});
  });

  it('al modificar conserva un producto dado de baja', async () => {
    const {backend, table, user} = await openPage();
    await user.click(within(rowOf(table, 'Martes de Hamburguesas')).getByRole('button', {name: 'Modificar Martes de Hamburguesas'}));
    const dialog = await screen.findByRole('dialog', {name: 'Modificar promoción'});
    expect(within(dialog).getByLabelText('Producto 1')).toHaveDisplayValue('Hamburguesa Hawaiana — Bs 45,00 (de baja)');
    expect(within(dialog).getByRole('button', {name: 'Martes'})).toHaveAttribute('aria-pressed', 'true');
    await user.click(within(dialog).getByRole('button', {name: 'Guardar'}));
    expect(await screen.findByText('Se actualizó la promoción Martes de Hamburguesas')).toBeInTheDocument();
    expect(backend.calls.saved.at(-1)).toMatchObject({valor: 20, productos: [{idProducto: 9, cantidad: 1}]});
  });

  it('confirma antes de dar de baja', async () => {
    const {table, user} = await openPage();
    await user.click(within(rowOf(table, 'Combo Brava')).getByRole('button', {name: 'Dar de baja Combo Brava'}));
    const dialog = await screen.findByRole('dialog', {name: 'Dar de baja promoción'});
    await user.click(within(dialog).getByRole('button', {name: 'Dar de baja'}));
    expect(await screen.findByText('Se dio de baja la promoción Combo Brava')).toBeInTheDocument();
  });

  it('calcula y valida sin la API', () => {
    const byId = new Map([['1', {precio: 58}], ['2', {precio: 15}]]);
    const values = {tipo: 'descuento', valor: '10', productos: [{idProducto: '1', cantidad: 1}, {idProducto: '2', cantidad: 1}]};
    expect(previewPricing(values, byId)).toEqual({regular: 73, promo: 65.7, ahorro: 7.3});
    expect(previewPricing({...values, productos: []}, byId)).toBeNull();
    const errors = validatePromotion({nombre: 'X', tipo: 'combo', valor: '', fechaInicio: '2026-10-10', fechaFin: '2026-10-01', dias: '1111111', productos: [{key: 'a', idProducto: '1', cantidad: 1}]}, {productsById: byId});
    expect(errors).toMatchObject({nombre: expect.any(String), valor: 'Ingrese el valor de la promoción', fechaFin: 'La fecha de fin no puede ser anterior al inicio', productos: 'Un combo necesita al menos 2 productos'});
    expect(toPayload({...values, nombre: ' A ', descripcion: '', fechaInicio: '2026-10-10', fechaFin: '', dias: '1111111', productos: [{idProducto: '1', cantidad: 3}]}).productos).toEqual([{idProducto: 1, cantidad: 1}]);
  });
});
