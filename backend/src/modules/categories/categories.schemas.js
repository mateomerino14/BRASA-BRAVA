import {z} from 'zod';

const defaultPageSize = 5;
const maxPageSize = 50;
const maxSubcategories = 20;

const name = (label) => z.string({error: `Ingrese ${label}`}).trim().min(2, `Ingrese ${label} (mínimo 2 letras)`).max(50, `${label} es demasiado largo`);

const subcategory = z.object({
  id: z.coerce.number().int().positive().optional(),
  nombre: name('el nombre de la subcategoría'),
});

const hasUniqueNames = (items) => new Set(items.map((item) => item.nombre.toLowerCase())).size === items.length;

export const categorySchema = z.object({
  nombre: name('el nombre de la categoría'),
  descripcion: z.string().trim().max(160, 'La descripción admite hasta 160 caracteres').optional().or(z.literal('')).transform((value) => value || null),
  subcategorias: z
    .array(subcategory, {error: 'Agregue al menos una subcategoría'})
    .min(1, 'Agregue al menos una subcategoría')
    .max(maxSubcategories, `Máximo ${maxSubcategories} subcategorías por categoría`)
    .refine(hasUniqueNames, 'Hay subcategorías repetidas'),
});

export const statusSchema = z.object({activo: z.boolean({error: 'Indique el estado'})});

export const idParamSchema = z.object({id: z.coerce.number().int().positive('Categoría inválida')});

export const listQuerySchema = z.object({
  search: z.string().trim().max(60).optional().default(''),
  estado: z.enum(['todos', 'activos', 'inactivos']).optional().default('todos'),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(maxPageSize).optional().default(defaultPageSize),
});
