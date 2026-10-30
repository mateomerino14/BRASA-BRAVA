import {z} from 'zod';
import {EMAIL_MAX_LENGTH} from '../../utils/limits.js';

// Fecha YYYY-MM-DD con el mensaje de error de su campo
const isoDate = (label) => z.string({error: `Elija la fecha ${label}`}).regex(/^\d{4}-\d{2}-\d{2}$/, `Elija la fecha ${label}`);
const MAX_RANGE_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

const empleado = z.union([z.literal('todos'), z.literal('directorio'), z.coerce.number().int().positive()], {error: 'Empleado inválido'}).default('todos');
const tipo = z.enum(['resumen', 'detalle'], {error: 'Elija resumen o ventas detalladas'}).default('resumen');

// Período, empleado y tipo de un reporte
export const reportQuerySchema = z.object({
  desde: isoDate('desde'),
  hasta: isoDate('hasta'),
  empleado,
  tipo,
}).refine((query) => query.desde <= query.hasta, {message: 'La fecha "hasta" no puede ser anterior a "desde"', path: ['hasta']})
  .refine((query) => (Date.parse(query.hasta) - Date.parse(query.desde)) / DAY_MS <= MAX_RANGE_DAYS, {message: 'El período no puede pasar de un año', path: ['hasta']});

const email = z.string({error: 'Ingrese el correo'}).trim().toLowerCase().email('Ingrese un correo válido').max(EMAIL_MAX_LENGTH, 'Correo demasiado largo');

// Reporte que se envía por correo
export const reportEmailSchema = z.object({
  desde: isoDate('desde'),
  hasta: isoDate('hasta'),
  empleado,
  tipo,
  correo: email,
}).refine((query) => query.desde <= query.hasta, {message: 'La fecha "hasta" no puede ser anterior a "desde"', path: ['hasta']});

// Envío programado: correo, tipo, días de la semana (7 dígitos de domingo a sábado) y hora HH:MM
export const scheduleSchema = z.object({
  correo: email,
  tipo,
  dias: z.string({error: 'Elija los días'}).regex(/^[01]{7}$/, 'Elija los días').refine((value) => value.includes('1'), 'Elija al menos un día'),
  hora: z.string({error: 'Elija la hora'}).regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Elija la hora'),
});

export const scheduleStatusSchema = z.object({activo: z.boolean({error: 'Indique si queda activo'})});

export const scheduleParamSchema = z.object({id: z.coerce.number({error: 'Envío inválido'}).int().positive('Envío inválido')});
