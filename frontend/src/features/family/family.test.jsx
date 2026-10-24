import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {mockApi} from '../../test/mockApi';
import {createFamilyBackend} from '../../test/familyBackend';
import {setViewport} from '../../test/viewport';
import {filterProducts, productStatus, promotionBand} from './utils/family';

const openFamily = async (route = '/familia') => {
  const backend = createFamilyBackend();
  mockApi(backend.handlers);
  const view = renderApp(route, {token: 't'});
  await screen.findByRole('button', {name: 'Ver Doble Brava'});
  return {backend, ...view};
};

const grid = () => screen.getByRole('list', {name: 'Productos'});
const names = () => within(grid()).getAllByRole('button').map((item) => item.getAttribute('aria-label'));

describe('Familia: avisos de error', () => {
  it('avisa arriba a la derecha si el catálogo no carga y permite reintentar', async () => {
    const backend = createFamilyBackend();
    let fail = true;
    const ok = backend.handlers['GET /catalog'];
    mockApi({...backend.handlers, 'GET /catalog': () => {
      if (fail) {
        return [500, {message: 'Ocurrió un error inesperado'}];
      }
      return ok();
    }});
    const {user} = renderApp('/familia', {token: 't'});
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el catálogo');
    expect(screen.getAllByText('No se pudo cargar el catálogo')).toHaveLength(2);
    fail = false;
    await user.click(screen.getByRole('button', {name: 'Reintentar'}));
    expect(await screen.findByRole('button', {name: 'Ver Doble Brava'})).toBeInTheDocument();
  });

  it('avisa si la receta no carga y la reintenta desde el detalle', async () => {
    const backend = createFamilyBackend();
    let fail = true;
    const ok = backend.handlers['GET /catalog/products/1'];
    mockApi({...backend.handlers, 'GET /catalog/products/1': () => {
      if (fail) {
        return [500, {message: 'Ocurrió un error inesperado'}];
      }
      return ok();
    }});
    const {user} = renderApp('/familia', {token: 't'});
    await user.click(await screen.findByRole('button', {name: 'Ver Hamburguesa Clásica'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar la receta');
    const dialog = screen.getByRole('dialog');
    fail = false;
    await user.click(within(dialog).getByRole('button', {name: 'Reintentar'}));
    expect(await within(dialog).findByRole('region', {name: 'Receta'})).toBeInTheDocument();
  });
});

describe('Familia: catálogo del local', () => {
  it('muestra los productos con su estado de stock, sin tarjetas de resumen', async () => {
    await openFamily();
    expect(screen.getByRole('heading', {name: 'Familia'})).toBeInTheDocument();
    expect(screen.queryByRole('region', {name: 'Resumen'})).not.toBeInTheDocument();
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
    expect(within(dialog).getByText('Hoy no alcanza para ninguna porción: falta lechuga. Se puede vender igual, pero avise a cocina.')).toBeInTheDocument();
    expect(within(dialog).getByText('Falta lechuga')).toBeInTheDocument();
    const rows = within(within(dialog).getByRole('region', {name: 'Receta'})).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('1 unidad de lechugano hay');
    expect(rows[1]).toHaveTextContent('0,15 kg de carne de respara 80');
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', {name: 'Ver Gaseosa 500 ml'}));
    const gaseosa = await screen.findByRole('dialog', {name: 'Gaseosa 500 ml'});
    expect(within(gaseosa).getByText('Todavía no tiene receta cargada, así que no se calcula cuánto alcanza.')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', {name: 'Ver Cerveza Artesanal'}));
    const cerveza = await screen.findByRole('dialog', {name: 'Cerveza Artesanal'});
    expect(within(cerveza).getByText('Está marcado como agotado: hoy no se vende en Caja.')).toBeInTheDocument();
    expect(within(cerveza).getByText('No se vende hoy')).toBeInTheDocument();
  });

  it('muestra las promociones con cuándo aplican, su precio y sus productos', async () => {
    const {user, location} = await openFamily();
    await user.click(screen.getByRole('radio', {name: 'Promociones'}));
    expect(location.current.search).toBe('?ver=promociones');
    const list = await screen.findByRole('list', {name: 'Promociones'});
    const combo = within(list).getByRole('button', {name: 'Ver Combo Brava'});
    expect(within(combo).getByText('Hoy')).toBeInTheDocument();
    expect(within(combo).getByText('Ahorra Bs 13,00')).toBeInTheDocument();
    expect(within(within(list).getByRole('button', {name: 'Ver Happy Hour Cervecero'})).getByText('Sin cerveza artesanal')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'cerveza');
    await waitFor(() => expect(within(list).getAllByRole('button')).toHaveLength(1));
    await user.click(within(list).getByRole('button', {name: 'Ver Happy Hour Cervecero'}));
    const dialog = await screen.findByRole('dialog', {name: 'Happy Hour Cervecero'});
    expect(within(dialog).getByText('Se vende lun a vie, desde el 18 oct 2026.')).toBeInTheDocument();
    expect(within(dialog).getByText('No se vende hoy')).toBeInTheDocument();
    const included = within(dialog).getByRole('region', {name: 'Productos de la promoción'});
    expect(within(included).getByRole('listitem')).toHaveTextContent('1 cerveza artesanal · agotadoBs 25,00');
  });

  it('se adapta al celular', async () => {
    setViewport(390);
    await openFamily();
    expect(screen.getByRole('button', {name: 'Ver Doble Brava'})).toBeInTheDocument();
  });

  it('calcula el estado de productos y promociones y filtra', () => {
    expect(productStatus({disponible: false, porciones: 10})).toEqual({key: 'agotado', tone: 'danger', label: 'Agotado'});
    expect(productStatus({disponible: true, porciones: null})).toBeNull();
    expect(promotionBand({disponible: true, vigencia: 'otro_dia', dias: '0010000'})).toEqual({key: 'otroDia', label: 'Martes', hint: 'Hoy no aplica'});
    expect(promotionBand({disponible: false, agotados: []})).toMatchObject({key: 'noSeVende', hint: 'Tiene un producto agotado'});
    const items = [{nombre: 'Café', descripcion: null, idCategoria: 1, idSubcategoria: 2}];
    expect(filterProducts(items, {categoria: 'todas', subcategoria: 'todas', search: 'cafe'})).toHaveLength(1);
    expect(filterProducts(items, {categoria: '3', subcategoria: 'todas', search: ''})).toHaveLength(0);
  });
});
