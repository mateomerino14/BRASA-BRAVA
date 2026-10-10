import {useState} from 'react';
import {fn} from 'storybook/test';
import {CategoriesTable} from './components/CategoriesTable';
import {SubcategoryChips} from './components/SubcategoryChips';

export default {title: 'Pantallas/Categorías', parameters: {layout: 'padded'}};

const subs = (...names) => names.map((nombre, index) => ({id: `${nombre}-${index}`, nombre}));

const CATEGORIES = [
  {id: 1, nombre: 'Hamburguesas', descripcion: 'Hamburguesas a la parrilla con pan artesanal', imagenUrl: '/favicon.png', activa: true, totalProductos: 12, subcategorias: subs('Clásicas', 'Especiales', 'Doble Carne', 'Veggie', 'Picantes')},
  {id: 2, nombre: 'Bebidas y Refrescos', descripcion: 'Gaseosas, jugos y cervezas bien frías', imagenUrl: null, activa: true, totalProductos: 8, subcategorias: subs('Gaseosas', 'Jugos Naturales', 'Cervezas')},
  {id: 4, nombre: 'Combos Especiales', descripcion: null, imagenUrl: null, activa: false, totalProductos: 0, subcategorias: subs('Dúo Parrillero', 'Familiar Brava')},
];

function TableDemo({loading = false, rows = CATEGORIES}) {
  const [page, setPage] = useState(1);
  return (
    <CategoriesTable categories={rows} total={rows.length} page={page} pageSize={5} totalPages={1} loading={loading} onPageChange={setPage} onEdit={fn()} onToggleStatus={fn()} />
  );
}

export const Tabla = {render: () => <TableDemo />};
export const TablaVacia = {render: () => <TableDemo rows={[]} />};
export const ChipsDesplegables = {
  render: () => <SubcategoryChips categoryName="Hamburguesas" subcategories={CATEGORIES[0].subcategorias} />,
};
