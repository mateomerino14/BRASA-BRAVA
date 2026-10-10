import {z} from 'zod';
import {decimalSchema} from '../../utils/numbers.js';

const MAX_QUANTITY = 99;
const MAX_LINES = 50;
const MAX_EXCLUSIONS = 30;

const positiveId = (message) => z.coerce.number({error: message}).int(message).positive(message);

const exclusion = z.object({
  idProducto: positiveId('Producto inválido'),
  idInsumo: positiveId('Ingrediente inválido'),
});

const orderItem = z.object({
  tipo: z.enum(['producto', 'promocion'], {error: 'Indique si es producto o promoción'}),
  id: positiveId('Producto inválido'),
  cantidad: z.coerce.number({error: 'Ingrese la cantidad'}).int('La cantidad es un número entero')
    .min(1, `La cantidad debe ser de 1 a ${MAX_QUANTITY}`)
    .max(MAX_QUANTITY, `La cantidad debe ser de 1 a ${MAX_QUANTITY}`),
  consumo: z.enum(['local', 'llevar'], {error: 'Indique si es para comer en el local o para llevar'}),
  exclusiones: z.array(exclusion).max(MAX_EXCLUSIONS, 'Demasiados ingredientes quitados').optional().default([]),
});

export const orderSchema = z.object({
  idMesero: positiveId('Elija el mesero'),
  items: z
    .array(orderItem, {error: 'Agregue al menos un producto'})
    .min(1, 'Agregue al menos un producto')
    .max(MAX_LINES, `Máximo ${MAX_LINES} líneas por envío`),
});

export const tableParamSchema = z.object({idMesa: positiveId('Mesa inválida')});

const MAX_AMOUNT = 100000;

const payment = z.object({
  metodo: z.enum(['efectivo', 'qr'], {error: 'Elija efectivo o QR'}),
  monto: decimalSchema({label: 'el monto', decimals: 2, max: MAX_AMOUNT}),
});

export const checkoutSchema = z.object({
  pagos: z
    .array(payment, {error: 'Indique cómo paga el cliente'})
    .min(1, 'Indique cómo paga el cliente')
    .max(2, 'Se admite efectivo, QR o ambos')
    .refine((items) => new Set(items.map((item) => item.metodo)).size === items.length, 'No repita el método de pago'),
  recibido: decimalSchema({label: 'el monto recibido', decimals: 2, max: MAX_AMOUNT}).optional().nullable(),
});

export const saleParamSchema = z.object({idVenta: positiveId('Pedido inválido')});
