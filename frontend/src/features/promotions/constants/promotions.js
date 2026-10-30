export {STATUS_OPTIONS} from '../../../config/lists';

export const NAME_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 200;
export const MAX_PRODUCTS = 10;
export const MAX_QUANTITY = 20;

export const VIGENCIA_OPTIONS = [
  {value: 'todos', label: 'Vigencia: Todas'},
  {value: 'vigentes', label: 'Vigentes hoy'},
  {value: 'programadas', label: 'Programadas'},
  {value: 'vencidas', label: 'Vencidas'},
];

export const VIGENCIA_META = {
  vigente: {label: 'Vigente ahora', tone: 'success'},
  mas_tarde: {label: 'Más tarde hoy', tone: 'warning'},
  termino_hoy: {label: 'Terminó por hoy', tone: 'neutral'},
  otro_dia: {label: 'Hoy no aplica', tone: 'neutral'},
  programada: {label: 'Programada', tone: 'brand'},
  vencida: {label: 'Vencida', tone: 'warning'},
  inactiva: {label: 'Inactiva', tone: 'danger'},
};
