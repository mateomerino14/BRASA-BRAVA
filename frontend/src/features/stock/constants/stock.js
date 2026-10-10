import {ArrowDownToLine, ArrowUpFromLine, Scale} from 'lucide-react';

export {STATUS_OPTIONS} from '../../../config/lists';

export const NAME_MAX_LENGTH = 60;
export const REASON_MAX_LENGTH = 160;
export const HISTORY_PAGE_SIZE = 8;

export const UNIT_OPTIONS = [
  {value: 'kg', label: 'Kilogramos (kg)'},
  {value: 'g', label: 'Gramos (g)'},
  {value: 'l', label: 'Litros (L)'},
  {value: 'ml', label: 'Mililitros (ml)'},
  {value: 'unidad', label: 'Unidades'},
];

export {UNIT_SUFFIX} from '../../../config/units';

export const LEVEL_OPTIONS = [
  {value: 'todos', label: 'Nivel: Todos'},
  {value: 'bajo', label: 'Stock bajo'},
  {value: 'sin_stock', label: 'Sin stock'},
];

export const LEVEL_META = {
  suficiente: {label: 'Suficiente', tone: 'success'},
  bajo: {label: 'Stock bajo', tone: 'warning'},
  sin_stock: {label: 'Sin stock', tone: 'danger'},
};

export const MOVEMENT_TYPES = [
  {value: 'entrada', label: 'Entrada', icon: ArrowDownToLine, hint: 'Compra o reposición: se suma al stock.', quantityLabel: 'Cantidad que ingresa'},
  {value: 'salida', label: 'Salida', icon: ArrowUpFromLine, hint: 'Merma, vencimiento o uso fuera de caja: se resta del stock.', quantityLabel: 'Cantidad que sale'},
  {value: 'ajuste', label: 'Ajuste', icon: Scale, hint: 'Conteo físico: el stock pasa a ser exactamente lo que contó.', quantityLabel: 'Stock contado'},
];

export const MOVEMENT_LABELS = {entrada: 'Entrada', salida: 'Salida', ajuste: 'Ajuste', venta: 'Venta'};

export const EMPTY_FORM = {nombre: '', unidad: '', stockMinimo: '', stockInicial: ''};

export const EMPTY_MOVEMENT = {tipo: 'entrada', cantidad: '', motivo: ''};

// Inicio del aviso de éxito según el tipo (con su género correcto)
export const MOVEMENT_DONE = {entrada: 'Entrada registrada', salida: 'Salida registrada', ajuste: 'Ajuste registrado'};
