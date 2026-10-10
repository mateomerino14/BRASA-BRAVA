import {fn} from 'storybook/test';
import {ProductCard} from './components/ProductCard';
import {PromotionCard} from './components/PromotionCard';
import {DetailModal} from './components/DetailModal';
import {FAMILY_CATALOG} from '../../test/familyBackend';

export default {title: 'Pantallas/Familia', parameters: {layout: 'padded'}};

const [clasica, doble, gaseosa, cerveza] = FAMILY_CATALOG.productos;
const [combo, happyHour] = FAMILY_CATALOG.promociones;

export const Productos = {
  render: () => (
    <div className="grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[clasica, doble, gaseosa, cerveza].map((item) => <ProductCard key={item.id} product={item} onOpen={fn()} />)}
    </div>
  ),
};

export const Promociones = {
  render: () => (
    <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <PromotionCard promotion={combo} onOpen={fn()} />
      <PromotionCard promotion={happyHour} onOpen={fn()} />
    </div>
  ),
};

const RECIPE = [
  {id: 1, nombre: 'Carne de res', unidad: 'kg', cantidad: 0.15, stock: 12, activo: true, nivel: 'suficiente', alcanza: 80},
  {id: 3, nombre: 'Queso cheddar', unidad: 'kg', cantidad: 0.03, stock: 1.5, activo: true, nivel: 'bajo', alcanza: 50},
  {id: 5, nombre: 'Lechuga', unidad: 'unidad', cantidad: 1, stock: 0, activo: true, nivel: 'sin_stock', alcanza: 0},
];

export const DetalleDeProducto = {render: () => <DetailModal detail={{open: true, kind: 'producto', item: {...clasica, receta: RECIPE}, loading: false, error: ''}} onClose={fn()} />};
export const DetalleDePromocion = {render: () => <DetailModal detail={{open: true, kind: 'promocion', item: combo, loading: false, error: ''}} onClose={fn()} />};
