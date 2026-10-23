import {z} from 'zod';
import {listQuerySchema as baseListQuery} from '../../utils/listQuery.js';
import {ASSIGNABLE_SCREENS} from '../auth/permissions.js';

const NAME_MIN = 2;
const NAME_MAX = 40;

export const roleSchema = z.object({
  nombre: z.string({error: 'Ingrese el nombre del cargo'}).trim()
    .min(NAME_MIN, 'Ingrese el nombre del cargo (mínimo 2 letras)')
    .max(NAME_MAX, 'El nombre es demasiado largo'),
  pantallas: z.array(z.enum(ASSIGNABLE_SCREENS, {error: 'Hay una pantalla que no existe'}), {error: 'Marque al menos una pantalla'})
    .min(1, 'Marque al menos una pantalla')
    .transform((screens) => [...new Set(screens)]),
});

export const statusSchema = z.object({activo: z.boolean({error: 'Indique el estado'})});

export const idParamSchema = z.object({id: z.coerce.number().int().positive('Cargo inválido')});

// Columnas por las que se puede ordenar el listado
export const ROLE_SORT_KEYS = ['nombre', 'empleados', 'pantallas', 'estado'];

export const listQuerySchema = baseListQuery(ROLE_SORT_KEYS);
