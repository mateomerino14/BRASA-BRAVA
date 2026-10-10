import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {mockApi} from '../../test/mockApi';
import {createFamilyBackend} from '../../test/familyBackend';
import {setViewport} from '../../test/viewport';
import {filterProducts, productStatus, promotionWhen} from './utils/family';

const openFamily = async (route = '/familia') => {
  const backend = createFamilyBackend();
  mockApi(backend.handlers);
  const view = renderApp(route, {token: 't'});
  await screen.findByRole('button', {name: 'Ver Doble Brava'});
  return {backend, ...view};
};

const grid = () => screen.getByRole('list', {name: 'Productos'});
const names = () => within(grid()).getAllByRole('button').map((item) => item.getAttribute('aria-label'));

describe('Familia: catálogo del local', () => {
  it('muestra el resumen y los productos con su estado de stock', async () => {
    await openFamily();
    expect(screen.getByRole('heading', {name: 'Familia'})).toBeInTheDocument();
    const summary = screen.getByRole('region', {name: 'Resumen'});
    expect(within(summary).getByText('Productos para vender').previousSibling).toHaveTextContent('2');
    expect(within(summary).getByText('Agotados o sin stock').previousSibling).toHaveTextContent('2');
    expect(within(summary).getByText('Promociones de hoy').previousSibling).toHaveTextContent('1');
    expect(within(screen.getByRole('button', {name: 'Ver Hamburguesa Clásica'})).getByText('Sin stock')).toBeInTheDocument();
    expect(within(screen.getByRole('button', {name: 'Ver Doble Brava'})).getByText('Quedan 3')).toBeInTheDocument();
    expect(within(screen.getByRole('button', {name: 'Ver Cerveza Artesanal'})).getByText('Agotado')).toBeInTheDocument();
  });

  it('filtra por categoría, subcategoría y búsqueda sin tildes, guardando todo en la dirección', async () => {
    const {user, location} = await openFamily();
    await user.click(screen.getByRole('radio', {name: 'Bebidas y Refrescos'}));
    await waitFor(() => expect(names()).toEqual(['Ver Gaseosa 500 ml', 'Ver Cerveza Artesanal']));
    await user.selectOptions(screen.getByLabelText('Filtrar por subcategoría'), 'Cervezas');
    await waitFor(() => expect(names()).toEqual(['Ver Cerveza Artesanal']));
    expect(location.current.search).toBe('?categoria=2&sub=22');
    await user.click(screen.getByRole('radio', {name: 'Todas'}));
    await user.type(screen.getByRole('searchbox'), 'clasica');
    await waitFor(() => expect(names()).toEqual(['Ver Hamburguesa Clásica']));
    expect(location.current.search).toBe('?q=clasica');
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'pizza');
    expect(await screen.findByText('No hay productos que coincidan con los filtros.')).toBeInTheDocument();
  });

  it('abre el detalle con la receta, el stock de cada insumo y cuántas porciones alcanzan', async () => {
    const {user, backend} = await openFamily();
    await user.click(screen.getByRole('button', {name: 'Ver Hamburguesa Clásica'}));
    const dialog = await screen.findByRole('dialog', {name: 'Hamburguesa Clásica'});
    expect(await within(dialog).findByRole('region', {name: 'Receta'})).toBeInTheDocument();
    expect(backend.calls).toEqual([1]);
    expect(within(dialog).getByText('No alcanza para ninguna porción con el stock actual. Se puede vender igual, pero avise a cocina.')).toBeInTheDocument();
    const rows = within(dialog).getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Carne de resSuficiente0,15 kg12 kg80');
    expect(rows[2]).toHaveTextContent('LechugaSin stock1 unidad0 unidades0');
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', {name: 'Ver Gaseosa 500 ml'}));
    const gaseosa = await screen.findByRole('dialog', {name: 'Gaseosa 500 ml'});
    expect(within(gaseosa).getByText('Sin receta cargada: no se puede calcular cuántas porciones alcanzan.')).toBeInTheDocument();
  });

  it('muestra las promociones con cuándo aplican, su precio y sus productos', async () => {
    const {user, location} = await openFamily();
    await user.click(screen.getByRole('radio', {name: 'Promociones'}));
    expect(location.current.search).toBe('?ver=promociones');
    const list = await screen.findByRole('list', {name: 'Promociones'});
    const combo = within(list).getByRole('button', {name: 'Ver Combo Brava'});
    expect(within(combo).getByText('Hoy')).toBeInTheDocument();
    expect(within(within(list).getByRole('button', {name: 'Ver Happy Hour Cervecero'})).getByText('Desde 18 oct 2026')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'cerveza');
    await waitFor(() => expect(within(list).getAllByRole('button')).toHaveLength(1));
    await user.click(within(list).getByRole('button', {name: 'Ver Happy Hour Cervecero'}));
    const dialog = await screen.findByRole('dialog', {name: 'Happy Hour Cervecero'});
    expect(within(dialog).getByText('Tiene productos agotados: hoy no se puede vender en Caja.')).toBeInTheDocument();
    expect(within(dialog).getByText('Lun a vie')).toBeInTheDocument();
    expect(within(dialog).getByText('Desde 18 oct 2026', {selector: 'strong'})).toBeInTheDocument();
  });

  it('se adapta al celular', async () => {
    setViewport(390);
    await openFamily();
    expect(screen.getByRole('button', {name: 'Ver Doble Brava'})).toBeInTheDocument();
  });

  it('calcula el estado de productos y promociones y filtra', () => {
    expect(productStatus({disponible: false, porciones: 10})).toEqual({tone: 'neutral', label: 'Agotado'});
    expect(productStatus({disponible: true, porciones: null})).toBeNull();
    expect(promotionWhen({vigencia: 'otro_dia', dias: '0010000'})).toEqual({tone: 'neutral', label: 'Martes'});
    const items = [{nombre: 'Café', descripcion: null, idCategoria: 1, idSubcategoria: 2}];
    expect(filterProducts(items, {categoria: 'todas', subcategoria: 'todas', search: 'cafe'})).toHaveLength(1);
    expect(filterProducts(items, {categoria: '3', subcategoria: 'todas', search: ''})).toHaveLength(0);
  });
});
