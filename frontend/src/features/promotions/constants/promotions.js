import {Layers, Percent} from 'lucide-react';

export {STATUS_OPTIONS} from '../../../config/lists';

export const NAME_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 200;
export const MAX_PRODUCTS = 10;
export const MAX_QUANTITY = 20;
export const MIN_DISCOUNT = 1;
export const MAX_DISCOUNT = 90;
export const ALL_DAYS = '1111111';

export const TYPE_OPTIONS = [
  {value: 'combo', label: 'Combo', icon: Layers},
  {value: 'descuento', label: 'Descuento %', icon: Percent},
];

export const TYPE_FILTER_OPTIONS = [
  {value: 'todos', label: 'Tipo: Todos'},
  {value: 'combo', label: 'Combos'},
  {value: 'descuento', label: 'Descuentos'},
];

export const VIGENCIA_OPTIONS = [
  {value: 'todos', label: 'Vigencia: Todas'},
  {value: 'vigentes', label: 'Vigentes hoy'},
  {value: 'programadas', label: 'Programadas'},
  {value: 'vencidas', label: 'Vencidas'},
];

export const VIGENCIA_META = {
  vigente: {label: 'Vigente hoy', tone: 'success'},
  otro_dia: {label: 'Hoy no aplica', tone: 'neutral'},
  programada: {label: 'Programada', tone: 'brand'},
  vencida: {label: 'Vencida', tone: 'warning'},
  inactiva: {label: 'Inactiva', tone: 'danger'},
};
