import {fn} from 'storybook/test';
import {SectionsTable} from './components/SectionsTable';
import {fakeList} from '../../stories/fakeList';

export default {title: 'Pantallas/Secciones y mesas', parameters: {layout: 'padded'}};

const tables = (prefix, count, capacidad) => Array.from({length: count}, (_, index) => ({id: `${prefix}-${index}`, nombre: `${prefix} ${index + 1}`, capacidad}));

const ROWS = [
  {id: 1, nombre: 'Salón principal', descripcion: 'Planta baja, junto a la parrilla', activa: true, mesas: tables('Mesa', 10, 4), totalMesas: 10, capacidad: 40},
  {id: 2, nombre: 'Terraza', descripcion: null, activa: true, mesas: tables('Terraza', 4, 4), totalMesas: 4, capacidad: 16},
  {id: 3, nombre: 'Salón VIP', descripcion: 'Reservas para eventos', activa: false, mesas: tables('VIP', 2, 8), totalMesas: 2, capacidad: 16},
];

const Table = () => <SectionsTable list={fakeList({items: ROWS})} onEdit={fn()} onToggleStatus={fn()} />;

export const Tabla = {render: () => <Table />};
export const EnCelular = {globals: {viewport: {value: 'mobile2'}}, render: () => <Table />};
