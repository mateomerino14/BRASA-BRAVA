import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {mockApi} from '../../test/mockApi';
import {createProductsBackend} from '../../test/productsBackend';
import {buildCategoryOptions, toPayload, validateProduct} from './utils/productForm';
import {computePortions, validateRecipe} from './utils/recipeForm';

const openPage = async (options) => {
  const backend = createProductsBackend(options);
  mockApi(backend.handlers);
  const view = renderApp('/productos', {token: 't'});
  const table = await screen.findByRole('table', {name: 'Productos'});
  await within(table).findByText('Hamburguesa Clásica');
  return {backend, table, ...view};
};

// El nombre del producto va en un <p>; la subcategoría puede llamarse igual (Dúo Parrillero)
const rowOf = (table, name) => within(table).getByText(name, {selector: 'p'}).closest('tr');

describe('Gestión de productos', () => {
  it('muestra foto, categoría, precio, disponibilidad, estado y avisos', async () => {
    const {table} = await openPage();
    expect(screen.getByRole('heading', {name: 'Gestión de productos'})).toBeInTheDocument();
    const clasica = rowOf(table, 'Hamburguesa Clásica');
    expect(within(clasica).getByRole('img', {name: 'Hamburguesa Clásica'})).toHaveAttribute('src', '/uploads/clasica.png');
    expect(within(clasica).getByLabelText('Bs 35,00')).toBeInTheDocument();
    expect(within(clasica).getByRole('switch', {name: 'Hamburguesa Clásica disponible'})).toHaveAttribute('aria-checked', 'true');
    expect(within(rowOf(table, 'Gaseosa 500 ml')).getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(within(rowOf(table, 'Dúo Parrillero')).getByText('Categoría de baja')).toBeInTheDocument();
    const hawaiana = rowOf(table, 'Hamburguesa Hawaiana');
    expect(within(hawaiana).getByText('Inactivo')).toBeInTheDocument();
    expect(within(hawaiana).getByRole('switch')).toBeDisabled();
  });

  it('filtra por categoría y muestra la subcategoría solo después', async () => {
    const {backend, user} = await openPage();
    expect(screen.queryByLabelText('Filtrar por subcategoría')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Filtrar por categoría'), 'Hamburguesas');
    await waitFor(() => expect(backend.calls.list.at(-1)).toMatchObject({idCategoria: '1'}));
    await user.selectOptions(screen.getByLabelText('Filtrar por subcategoría'), 'Especiales');
    await waitFor(() => expect(backend.calls.list.at(-1)).toMatchObject({idCategoria: '1', idSubcategoria: '2'}));
    await user.selectOptions(screen.getByLabelText('Filtrar por categoría'), 'Bebidas y Refrescos');
    await waitFor(() => expect(backend.calls.list.at(-1)).toMatchObject({idCategoria: '2'}));
    expect(backend.calls.list.at(-1).idSubcategoria).toBeUndefined();
    await user.selectOptions(screen.getByLabelText('Filtrar por disponibilidad'), 'agotados');
    await waitFor(() => expect(backend.calls.list.at(-1)).toMatchObject({disponibilidad: 'agotados'}));
  });

  it('marca un producto como agotado con el interruptor', async () => {
    const {backend, table, user} = await openPage();
    await user.click(within(rowOf(table, 'Hamburguesa Clásica')).getByRole('switch'));
    expect(await screen.findByText('Hamburguesa Clásica quedó marcado como agotado')).toBeInTheDocument();
    expect(backend.calls.availability).toEqual([{id: 1, disponible: false}]);
    await waitFor(() => expect(within(rowOf(table, 'Hamburguesa Clásica')).getByRole('switch')).toHaveAttribute('aria-checked', 'false'));
  });

  it('avisa si no se pudo cambiar la disponibilidad', async () => {
    const {table, user} = await openPage({failAvailability: true});
    await user.click(within(rowOf(table, 'Gaseosa 500 ml')).getByRole('switch'));
    expect(await screen.findByText('No se pudo cambiar la disponibilidad')).toBeInTheDocument();
  });

  it('valida y registra un producto con subcategoría dependiente y foto', async () => {
    const {backend, user} = await openPage();
    await user.click(screen.getByRole('button', {name: 'Registrar producto'}));
    const dialog = await screen.findByRole('dialog', {name: 'Registrar nuevo producto'});
    expect(within(dialog).getByLabelText(/^Subcategoría/)).toBeDisabled();
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await within(dialog).findByText('Ingrese el precio')).toBeInTheDocument();
    expect(within(dialog).getByText('Seleccione una categoría', {selector: 'p'})).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/^Nombre/), 'Hamburguesa Picante');
    await user.type(within(dialog).getByLabelText(/^Precio/), '42,50');
    await user.selectOptions(within(dialog).getByLabelText(/^Categoría/), 'Bebidas y Refrescos');
    // Bebidas tiene una sola subcategoría: se elige sola
    expect(within(dialog).getByLabelText(/^Subcategoría/)).toHaveValue('6');
    await user.selectOptions(within(dialog).getByLabelText(/^Categoría/), 'Hamburguesas');
    expect(within(dialog).getByLabelText(/^Subcategoría/)).toHaveValue('');
    await user.selectOptions(within(dialog).getByLabelText(/^Subcategoría/), 'Especiales');
    await user.upload(within(dialog).getByLabelText('Foto del producto', {selector: 'input'}), new File([new Uint8Array(32)], 'picante.png', {type: 'image/png'}));
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));

    expect(await screen.findByText('Se registró el producto Hamburguesa Picante')).toBeInTheDocument();
    expect(backend.calls.saved.at(-1)).toEqual({nombre: 'Hamburguesa Picante', descripcion: '', precio: 42.5, idSubcategoria: 2});
    expect(backend.calls.uploads[0].name).toBe('picante.png');
  });

  it('muestra el error de nombre repetido', async () => {
    const {user} = await openPage();
    await user.click(screen.getByRole('button', {name: 'Registrar producto'}));
    const dialog = await screen.findByRole('dialog', {name: 'Registrar nuevo producto'});
    await user.type(within(dialog).getByLabelText(/^Nombre/), 'gaseosa 500 ml');
    await user.type(within(dialog).getByLabelText(/^Precio/), '10');
    await user.selectOptions(within(dialog).getByLabelText(/^Categoría/), 'Bebidas y Refrescos');
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await within(dialog).findByText('Ya existe un producto con ese nombre')).toBeInTheDocument();
  });

  it('modifica un producto cuya categoría está de baja sin perderla', async () => {
    const {backend, table, user} = await openPage();
    await user.click(within(rowOf(table, 'Dúo Parrillero')).getByRole('button', {name: 'Modificar Dúo Parrillero'}));
    const dialog = await screen.findByRole('dialog', {name: 'Modificar producto'});
    expect(within(dialog).getByLabelText(/^Categoría/)).toHaveDisplayValue('Combos Especiales (inactiva)');
    expect(within(dialog).getByLabelText(/^Precio/)).toHaveValue('85,00');
    const price = within(dialog).getByLabelText(/^Precio/);
    await user.clear(price);
    await user.type(price, '90');
    await user.click(within(dialog).getByRole('button', {name: 'Guardar'}));
    expect(await screen.findByText('Se actualizó el producto Dúo Parrillero')).toBeInTheDocument();
    expect(backend.calls.saved.at(-1)).toMatchObject({precio: 90, idSubcategoria: 10});
  });

  it('confirma antes de dar de baja', async () => {
    const {table, user} = await openPage();
    await user.click(within(rowOf(table, 'Hamburguesa Clásica')).getByRole('button', {name: 'Dar de baja Hamburguesa Clásica'}));
    const dialog = await screen.findByRole('dialog', {name: 'Dar de baja producto'});
    await user.click(within(dialog).getByRole('button', {name: 'Dar de baja'}));
    expect(await screen.findByText('Se dio de baja el producto Hamburguesa Clásica')).toBeInTheDocument();
  });

  it('muestra cuántas porciones alcanzan según la receta', async () => {
    const {table} = await openPage();
    expect(within(rowOf(table, 'Hamburguesa Clásica')).getByText('25 porciones')).toBeInTheDocument();
    expect(within(rowOf(table, 'Gaseosa 500 ml')).getByText('Sin insumos')).toBeInTheDocument();
    expect(within(rowOf(table, 'Dúo Parrillero')).getByText('Sin receta')).toBeInTheDocument();
  });

  it('arma una receta nueva con porciones en vivo y la guarda', async () => {
    const {backend, table, user} = await openPage();
    await user.click(within(rowOf(table, 'Gaseosa 500 ml')).getByRole('button', {name: 'Receta de Gaseosa 500 ml'}));
    const dialog = await screen.findByRole('dialog', {name: 'Receta'});
    await within(dialog).findByLabelText('Insumo 1');
    expect(within(dialog).getByText(/Agregue insumos con su cantidad/)).toBeInTheDocument();
    await user.selectOptions(within(dialog).getByLabelText('Insumo 1'), 'Carne de res');
    expect(within(dialog).getByText('Stock: 12 kg')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('Cantidad 1'), '0,15');
    await user.click(within(dialog).getByRole('button', {name: 'Agregar insumo'}));
    await user.selectOptions(within(dialog).getByLabelText('Insumo 2'), 'Queso cheddar');
    await user.type(within(dialog).getByLabelText('Cantidad 2'), '0,06');
    // Carne: 12 / 0,15 = 80; queso: 1,5 / 0,06 = 25 → manda el queso
    expect(within(dialog).getByLabelText('25 porciones')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Guardar receta'}));
    expect(await screen.findByText('Se guardó la receta de Gaseosa 500 ml')).toBeInTheDocument();
    expect(backend.calls.recipes).toEqual([{id: 2, ingredientes: [{idInsumo: 1, cantidad: 0.15}, {idInsumo: 3, cantidad: 0.06}]}]);
  });

  it('carga la receta existente, marca el insumo de baja y valida repetidos', async () => {
    const {backend, table, user} = await openPage();
    await user.click(within(rowOf(table, 'Hamburguesa Clásica')).getByRole('button', {name: 'Receta de Hamburguesa Clásica'}));
    const dialog = await screen.findByRole('dialog', {name: 'Receta'});
    expect(await within(dialog).findByLabelText('Insumo 2')).toHaveDisplayValue('Tocino (de baja)');
    expect(within(dialog).getByText('Insumo dado de baja')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Cantidad 1')).toHaveValue('0,15');
    // Un insumo de baja cuenta como sin stock
    expect(within(dialog).getByLabelText('0 porciones')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Agregar insumo'}));
    await user.selectOptions(within(dialog).getByLabelText('Insumo 3'), 'Carne de res');
    await user.type(within(dialog).getByLabelText('Cantidad 3'), '1');
    await user.click(within(dialog).getByRole('button', {name: 'Guardar receta'}));
    expect(within(dialog).getByText('Este insumo ya está en la receta')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Quitar insumo 3'}));
    await user.click(within(dialog).getByRole('button', {name: 'Quitar insumo 2'}));
    await user.click(within(dialog).getByRole('button', {name: 'Guardar receta'}));
    expect(await screen.findByText('Se guardó la receta de Hamburguesa Clásica')).toBeInTheDocument();
    expect(backend.calls.recipes.at(-1)).toEqual({id: 1, ingredientes: [{idInsumo: 1, cantidad: 0.15}]});
  });

  it('valida el formulario y arma el cuerpo sin la API', () => {
    expect(validateProduct({nombre: 'X', precio: '10,555', idCategoria: '', idSubcategoria: ''})).toEqual({
      nombre: 'Ingrese el nombre del producto (mínimo 2 letras)',
      precio: 'Ingrese un precio válido, con hasta 2 decimales',
      idCategoria: 'Seleccione una categoría',
      idSubcategoria: 'Seleccione una subcategoría',
    });
    expect(validateProduct({nombre: 'Té', precio: '0', idCategoria: '1', idSubcategoria: '1'}).precio).toBe('El precio debe ser mayor a 0');
    expect(toPayload({nombre: ' Té ', descripcion: ' ', precio: '7,5', idSubcategoria: '3'})).toEqual({nombre: 'Té', descripcion: '', precio: 7.5, idSubcategoria: 3});
    const options = buildCategoryOptions([{id: 1, nombre: 'A', subcategorias: [{id: 1, nombre: 'a'}]}], {categoria: {id: 1, nombre: 'A'}, subcategoria: {id: 9, nombre: 'z'}});
    expect(options[0].subcategorias.map((sub) => sub.nombre)).toEqual(['a', 'z (inactiva)']);
    const stock = new Map([['1', {stockActual: 10, activo: true}], ['2', {stockActual: 3, activo: true}]]);
    expect(computePortions([{idInsumo: '1', cantidad: '2'}, {idInsumo: '2', cantidad: '0,5'}], stock)).toBe(5);
    expect(computePortions([{idInsumo: '', cantidad: ''}], stock)).toBeNull();
    expect(validateRecipe([{key: 'a', idInsumo: '', cantidad: '1'}, {key: 'b', idInsumo: '1', cantidad: '0'}])).toEqual({a: 'Seleccione un insumo', b: 'La cantidad debe ser mayor a 0'});
  });
});
