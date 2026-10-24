import {z} from 'zod';
import {listQuerySchema as baseListQuery} from '../../utils/listQuery.js';
import {decimalSchema} from '../../utils/numbers.js';

const NAME_MAX = 60;
const DESCRIPTION_MAX = 200;
const MAX_PRODUCTS = 10;
const MAX_QUANTITY = 20;
const MAX_VALUE = 99999.99;
const MIN_COMBO_ITEMS = 2;

const productItem = z.object({
  idProducto: z.coerce.number({error: 'Seleccione un producto'}).int().positive('Seleccione un producto'),
  cantidad: z.coerce.number().int('La cantidad es un número entero').min(1, 'La cantidad mínima es 1').max(MAX_QUANTITY, `La cantidad máxima es ${MAX_QUANTITY}`).optional().default(1),
});

// Indica si los productos de la promoción no se repiten
const hasUniqueProducts = (items) => new Set(items.map((item) => item.idProducto)).size === items.length;

const optionalTime = z.union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Ingrese una hora válida (HH:MM)'), z.literal(''), z.null()]).optional().transform((value) => value || null);

const optionalDate = z.union([z.iso.date({error: 'Ingrese una fecha válida'}), z.literal(''), z.null()]).optional().transform((value) => value || null);

export const promotionSchema = z.object({
  nombre: z.string({error: 'Ingrese el nombre de la promoción'}).trim().min(2, 'Ingrese el nombre de la promoción (mínimo 2 letras)').max(NAME_MAX, 'El nombre es demasiado largo'),
  descripcion: z.string().trim().max(DESCRIPTION_MAX, `La descripción admite hasta ${DESCRIPTION_MAX} caracteres`).optional().or(z.literal('')).transform((value) => value || null),
  tipo: z.enum(['combo'], {error: 'Por ahora solo se pueden registrar combos'}),
  valor: decimalSchema({label: 'el valor', decimals: 2, max: MAX_VALUE}),
  fechaInicio: z.iso.date({error: 'Ingrese la fecha de inicio'}),
  fechaFin: optionalDate,
  horaInicio: optionalTime,
  horaFin: optionalTime,
  dias: z.string({error: 'Elija los días'}).regex(/^[01]{7}$/, 'Días inválidos').refine((value) => value.includes('1'), 'Elija al menos un día de la semana'),
  productos: z
    .array(productItem, {error: 'Agregue los productos de la promoción'})
    .min(1, 'Agregue al menos un producto')
    .max(MAX_PRODUCTS, `Máximo ${MAX_PRODUCTS} productos por promoción`)
    .refine(hasUniqueProducts, 'Hay productos repetidos en la promoción'),
}).superRefine((data, ctx) => {
  if (data.fechaFin && data.fechaFin < data.fechaInicio) {
    ctx.addIssue({code: 'custom', path: ['fechaFin'], message: 'La fecha de fin no puede ser anterior al inicio'});
  }
  if (data.horaInicio && !data.horaFin) {
    ctx.addIssue({code: 'custom', path: ['horaFin'], message: 'Ingrese también la hora de fin'});
  }
  if (data.horaFin && !data.horaInicio) {
    ctx.addIssue({code: 'custom', path: ['horaInicio'], message: 'Ingrese también la hora de inicio'});
  }
  if (data.horaInicio && data.horaFin && data.horaFin <= data.horaInicio) {
    ctx.addIssue({code: 'custom', path: ['horaFin'], message: 'La hora de fin debe ser después de la de inicio'});
  }
  if (data.productos.reduce((total, item) => total + item.cantidad, 0) < MIN_COMBO_ITEMS) {
    ctx.addIssue({code: 'custom', path: ['productos'], message: 'Un combo necesita al menos 2 productos'});
  }
});

export const statusSchema = z.object({activo: z.boolean({error: 'Indique el estado'})});

export const idParamSchema = z.object({id: z.coerce.number().int().positive('Promoción inválida')});

// Columnas por las que se puede ordenar el listado
export const PROMOTION_SORT_KEYS = ['nombre', 'inicio', 'estado'];

export const listQuerySchema = baseListQuery(PROMOTION_SORT_KEYS, {
  tipo: z.enum(['todos', 'descuento', 'combo']).optional().default('todos'),
  vigencia: z.enum(['todos', 'vigentes', 'programadas', 'vencidas']).optional().default('todos'),
});
