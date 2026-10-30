import {z} from 'zod';
import {listQuerySchema as baseListQuery} from '../../utils/listQuery.js';
import {NAME_MIN_LENGTH} from '../../utils/limits.js';

const NAME_MAX = 50;
const TABLE_NAME_MAX = 30;
const DESCRIPTION_MAX = 160;
const MIN_CAPACITY = 1;
const MAX_CAPACITY = 30;
const MAX_TABLES = 50;

// Indica si los nombres no se repiten
const hasUniqueNames = (items) => new Set(items.map((item) => item.nombre.toLowerCase())).size === items.length;

const table = z.object({
  id: z.coerce.number().int().positive().optional(),
  nombre: z.string({error: 'Ingrese el nombre de la mesa'}).trim().min(1, 'Ingrese el nombre de la mesa').max(TABLE_NAME_MAX, 'El nombre de la mesa es demasiado largo'),
  capacidad: z.coerce.number({error: 'Ingrese la capacidad'}).int('La capacidad es un número entero de personas')
    .min(MIN_CAPACITY, `La capacidad debe ser de ${MIN_CAPACITY} a ${MAX_CAPACITY} personas`)
    .max(MAX_CAPACITY, `La capacidad debe ser de ${MIN_CAPACITY} a ${MAX_CAPACITY} personas`),
});

export const sectionSchema = z.object({
  nombre: z.string({error: 'Ingrese el nombre de la sección'}).trim().min(NAME_MIN_LENGTH, `Ingrese el nombre de la sección (mínimo ${NAME_MIN_LENGTH} letras)`).max(NAME_MAX, 'El nombre es demasiado largo'),
  descripcion: z.string().trim().max(DESCRIPTION_MAX, `La descripción admite hasta ${DESCRIPTION_MAX} caracteres`).optional().or(z.literal('')).transform((value) => value || null),
  mesas: z
    .array(table, {error: 'Agregue al menos una mesa'})
    .min(1, 'Agregue al menos una mesa')
    .max(MAX_TABLES, `Máximo ${MAX_TABLES} mesas por sección`)
    .refine(hasUniqueNames, 'Hay mesas con el mismo nombre'),
});

export const statusSchema = z.object({activo: z.boolean({error: 'Indique el estado'})});

export const idParamSchema = z.object({id: z.coerce.number().int().positive('Sección inválida')});

// Columnas por las que se puede ordenar el listado
const SECTION_SORT_KEYS = ['nombre', 'mesas', 'capacidad', 'estado'];

export const listQuerySchema = baseListQuery(SECTION_SORT_KEYS);
