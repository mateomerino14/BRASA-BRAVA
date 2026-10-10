import {useState} from 'react';
import {fn} from 'storybook/test';
import {CategoriesTable} from './components/CategoriesTable';
import {SubcategoryChips} from './components/SubcategoryChips';
import {fakeList} from '../../stories/fakeList';

export default {title: 'Pantallas/Categorías', parameters: {layout: 'padded'}};

const subs = (...names) => names.map((nombre, index) => ({id: `${nombre}-${index}`, nombre}));

const CATEGORIES = [
  {id: 1, nombre: 'Hamburguesas', descripcion: 'Hamburguesas a la parrilla con pan artesanal', imagenUrl: '/favicon.png', activa: true, totalProductos: 12, subcategorias: subs('Clásicas', 'Especiales', 'Doble Carne', 'Veggie', 'Picantes')},
  {id: 2, nombre: 'Bebidas y Refrescos', descripcion: 'Gaseosas, jugos y cervezas bien frías', imagenUrl: null, activa: true, totalProductos: 8, subcategorias: subs('Gaseosas', 'Jugos Naturales', 'Cervezas')},
  {id: 4, nombre: 'Combos Especiales', descripcion: null, imagenUrl: null, activa: false, totalProductos: 0, subcategorias: subs('Dúo Parrillero', 'Familiar Brava')},
];

function TableDemo({rows = CATEGORIES}) {
  const [sort, setSort] = useState({key: '', dir: 'asc'});
  const list = fakeList({items: rows, sort, hasActiveFilters: rows.length === 0, handlers: {changeSort: (key, dir) => setSort({key, dir: dir ?? 'asc'})}});
  return <CategoriesTable list={list} onEdit={fn()} onToggleStatus={fn()} />;
}

export const Tabla = {render: () => <TableDemo />};
export const TablaVacia = {render: () => <TableDemo rows={[]} />};
export const ChipsDesplegables = {
  render: () => <SubcategoryChips categoryName="Hamburguesas" subcategories={CATEGORIES[0].subcategorias} />,
};
