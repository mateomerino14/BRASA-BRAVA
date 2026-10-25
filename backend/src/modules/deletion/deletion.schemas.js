import {z} from 'zod';

const MAX_IDS = 2000;
const ids = z.array(z.coerce.number().int().positive(), {error: 'Selección inválida'}).max(MAX_IDS, 'Demasiados registros a la vez').optional().default([])
  .transform((list) => [...new Set(list)]);

const TYPES = ['empleados', 'cargos', 'secciones', 'productos', 'categorias', 'insumos', 'promociones', 'ventas'];

// Lo elegido para eliminar, por tipo
export const selectionSchema = z.object(Object.fromEntries(TYPES.map((tipo) => [tipo, ids])))
  .refine((selection) => TYPES.some((tipo) => selection[tipo].length > 0), 'Marque al menos un registro');

export const executeSchema = z.object({
  ...Object.fromEntries(TYPES.map((tipo) => [tipo, ids])),
  confirmacion: z.string().optional().default(''),
}).refine((selection) => TYPES.some((tipo) => selection[tipo].length > 0), 'Marque al menos un registro');

export const typeParamSchema = z.object({tipo: z.enum(TYPES, {error: 'Tipo de registro inválido'})});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida');

// Rango de fechas de la pestaña de ventas (en las demás no se usa)
export const candidatesQuerySchema = z.object({
  desde: isoDate.optional().default('1970-01-01'),
  hasta: isoDate.optional().default('2999-12-31'),
});
