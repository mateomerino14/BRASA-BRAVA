import {z} from 'zod';
import {listQuerySchema as baseListQuery} from '../../utils/listQuery.js';
import {decimalSchema} from '../../utils/numbers.js';

export const UNITS = ['kg', 'g', 'l', 'ml', 'unidad'];
export const MOVEMENT_TYPES = ['entrada', 'salida', 'ajuste'];

const NAME_MAX = 60;
const REASON_MAX = 160;
const QUANTITY_DECIMALS = 3;
const MAX_QUANTITY = 999999.999;
const DEFAULT_HISTORY_SIZE = 10;
const MAX_HISTORY_SIZE = 50;

const quantity = (label) => decimalSchema({label, decimals: QUANTITY_DECIMALS, max: MAX_QUANTITY, allowZero: true});

const baseFields = {
  nombre: z.string({error: 'Ingrese el nombre del insumo'}).trim().min(2, 'Ingrese el nombre del insumo (mínimo 2 letras)').max(NAME_MAX, 'El nombre es demasiado largo'),
  unidad: z.enum(UNITS, {error: 'Seleccione la unidad de medida'}),
  stockMinimo: quantity('el stock mínimo'),
};

export const createIngredientSchema = z.object({
  ...baseFields,
  stockInicial: quantity('el stock inicial').optional().default(0),
});

export const updateIngredientSchema = z.object(baseFields);

// Entrada y salida mueven una cantidad mayor a 0; el ajuste fija el conteo real (puede ser 0)
export const movementSchema = z.object({
  tipo: z.enum(MOVEMENT_TYPES, {error: 'Seleccione el tipo de movimiento'}),
  cantidad: quantity('la cantidad'),
  motivo: z.string().trim().max(REASON_MAX, `El motivo admite hasta ${REASON_MAX} caracteres`).optional().or(z.literal('')).transform((value) => value || null),
}).refine((data) => data.tipo === 'ajuste' || data.cantidad > 0, {message: 'La cantidad debe ser mayor a 0', path: ['cantidad']});

export const statusSchema = z.object({activo: z.boolean({error: 'Indique el estado'})});

export const idParamSchema = z.object({id: z.coerce.number().int().positive('Insumo inválido')});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_HISTORY_SIZE).optional().default(DEFAULT_HISTORY_SIZE),
});

// Columnas por las que se puede ordenar el listado
export const INGREDIENT_SORT_KEYS = ['nombre', 'stock', 'estado'];

export const listQuerySchema = baseListQuery(INGREDIENT_SORT_KEYS, {
  // "bajo" incluye los que están sin stock
  nivel: z.enum(['todos', 'bajo', 'sin_stock']).optional().default('todos'),
});
