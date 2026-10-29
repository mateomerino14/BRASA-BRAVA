export {STATUS_OPTIONS} from '../../../config/lists';

export const NAME_MAX_LENGTH = 80;
export const DESCRIPTION_MAX_LENGTH = 200;

export const AVAILABILITY_OPTIONS = [
  {value: 'todos', label: 'Disponibilidad: Todas'},
  {value: 'disponibles', label: 'Disponibles'},
  {value: 'agotados', label: 'Agotados'},
];

export const EMPTY_FORM = {
  nombre: '',
  descripcion: '',
  precio: '',
  idCategoria: '',
  idSubcategoria: '',
};
