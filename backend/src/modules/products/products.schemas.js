import {z} from 'zod';
import {listQuerySchema as baseListQuery} from '../../utils/listQuery.js';
import {decimalSchema} from '../../utils/numbers.js';

const NAME_MAX = 80;
const DESCRIPTION_MAX = 200;
const MAX_PRICE = 99999.99;
const PRICE_DECIMALS = 2;

const id = (message) => z.coerce.number({error: message}).int(message).positive(message);

// Acepta "35", "35.5" o "35,50"
const price = decimalSchema({label: 'el precio', decimals: PRICE_DECIMALS, max: MAX_PRICE});

export const productSchema = z.object({
  nombre: z.string({error: 'Ingrese el nombre del producto'}).trim().min(2, 'Ingrese el nombre del producto (mínimo 2 letras)').max(NAME_MAX, 'El nombre es demasiado largo'),
  descripcion: z.string().trim().max(DESCRIPTION_MAX, `La descripción admite hasta ${DESCRIPTION_MAX} caracteres`).optional().or(z.literal('')).transform((value) => value || null),
  precio: price,
  idSubcategoria: id('Seleccione una subcategoría'),
});

export const statusSchema = z.object({activo: z.boolean({error: 'Indique el estado'})});

export const availabilitySchema = z.object({disponible: z.boolean({error: 'Indique la disponibilidad'})});

export const idParamSchema = z.object({id: id('Producto inválido')});

// Columnas por las que se puede ordenar el listado
export const PRODUCT_SORT_KEYS = ['nombre', 'precio', 'categoria', 'estado'];

export const listQuerySchema = baseListQuery(PRODUCT_SORT_KEYS, {
  idCategoria: z.coerce.number().int().positive().optional(),
  idSubcategoria: z.coerce.number().int().positive().optional(),
  disponibilidad: z.enum(['todos', 'disponibles', 'agotados']).optional().default('todos'),
});
