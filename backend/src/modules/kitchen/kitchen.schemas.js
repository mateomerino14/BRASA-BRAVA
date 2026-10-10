import {z} from 'zod';

const positiveId = (message) => z.coerce.number({error: message}).int(message).positive(message);

export const lineParamSchema = z.object({id: positiveId('Línea inválida')});

export const shipmentParamSchema = z.object({
  idVenta: positiveId('Pedido inválido'),
  envio: positiveId('Envío inválido'),
});

export const lineActionSchema = z.object({
  accion: z.enum(['sumar', 'restar', 'todos', 'ninguno'], {error: 'Indique si suma, resta, marca todo o nada'}),
});

export const shipmentActionSchema = z.object({
  accion: z.enum(['todos', 'ninguno'], {error: 'Indique si marca todo listo o todo en preparación'}),
});
