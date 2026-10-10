import {fn} from 'storybook/test';
import {IngredientsTable} from './components/IngredientsTable';
import {fakeList} from '../../stories/fakeList';

export default {title: 'Pantallas/Stock', parameters: {layout: 'padded'}};

const ROWS = [
  {id: 1, nombre: 'Carne de res', unidad: 'kg', stockActual: 12, stockMinimo: 5, nivel: 'suficiente', activo: true},
  {id: 2, nombre: 'Queso cheddar', unidad: 'kg', stockActual: 1.5, stockMinimo: 2, nivel: 'bajo', activo: true},
  {id: 3, nombre: 'Lechuga', unidad: 'unidad', stockActual: 0, stockMinimo: 5, nivel: 'sin_stock', activo: true},
  {id: 4, nombre: 'Aceite', unidad: 'l', stockActual: 6, stockMinimo: 4, nivel: 'suficiente', activo: false},
];

const Table = () => <IngredientsTable list={fakeList({items: ROWS})} onEdit={fn()} onToggleStatus={fn()} onMove={fn()} onHistory={fn()} />;

export const Tabla = {render: () => <Table />};
export const EnCelular = {globals: {viewport: {value: 'mobile2'}}, render: () => <Table />};
