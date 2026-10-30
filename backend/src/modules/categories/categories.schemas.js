import {z} from 'zod';
import {listQuerySchema as baseListQuery} from '../../utils/listQuery.js';
import {NAME_MIN_LENGTH} from '../../utils/limits.js';

const maxSubcategories = 20;
const NAME_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 160;

// Nombre obligatorio de 2 caracteres o más
const name = (label) => z.string({error: `Ingrese ${label}`}).trim().min(NAME_MIN_LENGTH, `Ingrese ${label} (mínimo ${NAME_MIN_LENGTH} letras)`).max(NAME_MAX_LENGTH, `${label} es demasiado largo`);

const subcategory = z.object({
  id: z.coerce.number().int().positive().optional(),
  nombre: name('el nombre de la subcategoría'),
});

// Indica si los nombres no se repiten
const hasUniqueNames = (items) => new Set(items.map((item) => item.nombre.toLowerCase())).size === items.length;

export const categorySchema = z.object({
  nombre: name('el nombre de la categoría'),
  descripcion: z.string().trim().max(DESCRIPTION_MAX_LENGTH, `La descripción admite hasta ${DESCRIPTION_MAX_LENGTH} caracteres`).optional().or(z.literal('')).transform((value) => value || null),
  subcategorias: z
    .array(subcategory, {error: 'Agregue al menos una subcategoría'})
    .min(1, 'Agregue al menos una subcategoría')
    .max(maxSubcategories, `Máximo ${maxSubcategories} subcategorías por categoría`)
    .refine(hasUniqueNames, 'Hay subcategorías repetidas'),
});

export const statusSchema = z.object({activo: z.boolean({error: 'Indique el estado'})});

export const idParamSchema = z.object({id: z.coerce.number().int().positive('Categoría inválida')});

// Columnas por las que se puede ordenar el listado
const CATEGORY_SORT_KEYS = ['nombre', 'productos', 'estado'];

export const listQuerySchema = baseListQuery(CATEGORY_SORT_KEYS);
