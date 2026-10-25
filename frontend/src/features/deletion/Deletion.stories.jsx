import {fn} from 'storybook/test';
import {DeletionTable} from './components/DeletionTable';
import {DeletionConfirmModal} from './components/DeletionConfirmModal';

export default {title: 'Pantallas/Eliminación física', parameters: {layout: 'padded'}};

const EMPLOYEES = [
  {id: 1, nombre: 'Jorge Quispe', alias: 'j.quispe', cargo: 'Mesero', ventas: 0},
  {id: 2, nombre: 'Luis Mamani', alias: 'l.mamani', cargo: 'Mesero', ventas: 34},
  {id: 3, nombre: 'Rosa Flores', alias: 'r.flores', cargo: 'Cocinero', ventas: 0},
];

const PREVIEW = {
  elegidos: {empleados: ['Luis Mamani'], cargos: [], secciones: ['Patio'], productos: [], categorias: [], insumos: [], promociones: [], ventas: 0},
  arrastra: {
    empleados: [],
    mesas: ['Patio 1', 'Patio 2', 'Patio 3', 'Patio 4'],
    productos: [],
    promociones: [],
    ventas: {total: 34, ejemplos: [{id: 12, mesa: 'Mesa 3', total: 120}, {id: 15, mesa: 'Terraza 1', total: 86}]},
  },
  bloqueos: [],
};

const deletion = (data) => ({
  preview: {open: true, loading: false, data},
  closePreview: fn(),
  confirmacion: '',
  changeConfirmacion: fn(),
  confirmError: '',
  execute: fn(),
  executing: false,
});

export const Empleados = {render: () => <DeletionTable tipo="empleados" rows={EMPLOYEES} selected={[2]} onToggle={fn()} label="Empleados" />};
export const Confirmacion = {render: () => <DeletionConfirmModal deletion={deletion(PREVIEW)} />};
export const Bloqueada = {
  render: () => <DeletionConfirmModal deletion={deletion({...PREVIEW, bloqueos: ['Hay 1 pedidos abiertos que dependen de lo elegido (Mesa 2): cóbrelos antes']})} />,
};
