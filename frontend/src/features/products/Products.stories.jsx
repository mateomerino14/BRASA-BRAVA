import {useState} from 'react';
import {fn} from 'storybook/test';
import {ProductsTable} from './components/ProductsTable';
import {fakeList} from '../../stories/fakeList';

export default {title: 'Pantallas/Productos', parameters: {layout: 'padded'}};

const category = (id, nombre, activa = true) => ({id, nombre, activa});
const sub = (id, nombre) => ({id, nombre, activa: true});

const PRODUCTS = [
  {id: 1, nombre: 'Hamburguesa Clásica', descripcion: 'Carne a la parrilla, queso, lechuga y tomate', precio: 35, imagenUrl: '/favicon.png', activo: true, disponible: true, categoria: category(1, 'Hamburguesas'), subcategoria: sub(1, 'Clásicas')},
  {id: 2, nombre: 'Cerveza Artesanal', descripcion: 'Rubia de la casa, 330 ml', precio: 25, imagenUrl: null, activo: true, disponible: false, categoria: category(2, 'Bebidas y Refrescos'), subcategoria: sub(8, 'Cervezas')},
  {id: 3, nombre: 'Dúo Parrillero', descripcion: 'Dos hamburguesas, papas y gaseosas', precio: 85, imagenUrl: null, activo: true, disponible: true, categoria: category(4, 'Combos Especiales', false), subcategoria: sub(10, 'Dúo Parrillero')},
  {id: 4, nombre: 'Hamburguesa Hawaiana', descripcion: 'Piña a la plancha y jamón', precio: 45, imagenUrl: null, activo: false, disponible: true, categoria: category(1, 'Hamburguesas'), subcategoria: sub(2, 'Especiales')},
];

function TableDemo() {
  const [rows, setRows] = useState(PRODUCTS);
  const availability = {
    isPending: () => false,
    toggle: (product) => setRows((current) => current.map((item) => (item.id === product.id ? {...item, disponible: !item.disponible} : item))),
  };
  return <ProductsTable list={fakeList({items: rows})} onEdit={fn()} onToggleStatus={fn()} availability={availability} />;
}

export const Tabla = {render: () => <TableDemo />};
export const EnCelular = {globals: {viewport: {value: 'mobile2'}}, render: () => <TableDemo />};
