export {STATUS_OPTIONS} from '../../../config/lists';
export {UNIT_SUFFIX} from '../../../config/units';

export const NAME_MAX_LENGTH = 60;

export const UNIT_OPTIONS = [
  {value: 'kg', label: 'Kilogramos (kg)'},
  {value: 'g', label: 'Gramos (g)'},
  {value: 'l', label: 'Litros (L)'},
  {value: 'ml', label: 'Mililitros (ml)'},
  {value: 'unidad', label: 'Unidades'},
];

export const UNIT_NAMES = {kg: 'Kilogramos', g: 'Gramos', l: 'Litros', ml: 'Mililitros', unidad: 'Unidades'};

export const LEVEL_TONES = {suficiente: 'text-carbon', bajo: 'text-brasa-oscuro', sin_stock: 'text-error'};

export const EMPTY_FORM = {nombre: '', unidad: '', stockActual: '', stockMinimo: ''};
