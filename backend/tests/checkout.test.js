import request from 'supertest';
import {afterEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';

// Martes 13 de octubre de 2026, 20:00 en La Paz
const NOW = new Date('2026-10-14T00:00:00Z');

describe('Caja: cobro, ticket y ventas del día', () => {
  let ctx;
  let cajero;

  const start = async () => {
    ctx = await createTestApp({clock: () => NOW});
    cajero = await loginAs(ctx.app, 'a.romero');
  };
  afterEach(() => ctx.db.close());

  const api = (method, url, session = cajero) => request(ctx.app)[method](url).set('authorization', session.authorization);
  const tableId = async (name) => (await ctx.db.query('SELECT id_mesa FROM mesa WHERE nombre = $1', [name])).rows[0].id_mesa;
  const readyAll = () => ctx.db.query('UPDATE venta_detalle SET listos = cantidad');
  const checkout = async (mesa, body, session) => api('post', `/api/sales/tables/${await tableId(mesa)}/checkout`, session).send(body);

  it('exige el permiso de caja', async () => {
    await start();
    const cocinero = await loginAs(ctx.app, 'r.sanchez');
    expect((await checkout('Mesa 2', {pagos: [{metodo: 'qr', monto: 160}]}, cocinero)).status).toBe(403);
  });

  it('no cobra mientras cocina tenga unidades sin marcar como listas', async () => {
    await start();
    const res = await checkout('Mesa 2', {pagos: [{metodo: 'qr', monto: 160}]});
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Faltan 3 unidades por marcar como listas en cocina');
  });

  it('cobra en efectivo con cambio, devuelve el ticket acumulado y libera la mesa', async () => {
    await start();
    await readyAll();
    const res = await checkout('Mesa 2', {pagos: [{metodo: 'efectivo', monto: '160'}], recibido: '200,00'});
    expect(res.status).toBe(201);
    expect(res.body.ticket).toMatchObject({
      estado: 'cobrada', mesa: 'Mesa 2', seccion: 'Salón principal', mesero: 'Carlos Mendoza', cajero: 'a.romero', cobrador: 'a.romero',
      total: 160, pagos: [{metodo: 'efectivo', monto: 160}], recibido: 200, cambio: 40,
    });
    expect(new Date(res.body.ticket.cerradaEn).getTime()).toBe(NOW.getTime());
    expect(res.body.ticket.lineas).toEqual([
      {nombre: 'Hamburguesa Clásica', consumo: 'local', precioUnitario: 35, cantidad: 2, subtotal: 70},
      {nombre: 'Combo Brava', consumo: 'local', precioUnitario: 70, cantidad: 1, subtotal: 70},
      {nombre: 'Gaseosa 500 ml', consumo: 'local', precioUnitario: 10, cantidad: 2, subtotal: 20},
    ]);
    const table = await api('get', `/api/sales/tables/${await tableId('Mesa 2')}`);
    expect(table.body.venta).toBeNull();
    const floor = await api('get', '/api/sales/floor');
    expect(floor.body.summary).toMatchObject({ocupadas: 1, porCobrar: 103});
    const again = await checkout('Mesa 2', {pagos: [{metodo: 'qr', monto: 160}]});
    expect(again.status).toBe(404);
    expect(again.body.message).toBe('La mesa no tiene un pedido abierto para cobrar');
    const receipt = await api('get', `/api/sales/${res.body.ticket.id}/receipt`);
    expect(receipt.body.ticket).toEqual(res.body.ticket);
  });

  it('cobra con QR o mixto; sin monto recibido el efectivo es exacto', async () => {
    await start();
    await readyAll();
    const qr = await checkout('Terraza 1', {pagos: [{metodo: 'qr', monto: 103}]});
    expect(qr.body.ticket).toMatchObject({pagos: [{metodo: 'qr', monto: 103}], recibido: null, cambio: null});
    const mixed = await checkout('Mesa 2', {pagos: [{metodo: 'efectivo', monto: 100}, {metodo: 'qr', monto: 60}]});
    expect(mixed.status).toBe(201);
    expect(mixed.body.ticket).toMatchObject({recibido: 100, cambio: 0, pagos: [{metodo: 'efectivo', monto: 100}, {metodo: 'qr', monto: 60}]});
  });

  it('valida que los pagos sumen el total, el efectivo recibido y los métodos', async () => {
    await start();
    await readyAll();
    const cases = [
      [{pagos: [{metodo: 'qr', monto: 150}]}, 400, 'Los pagos deben sumar exactamente Bs 160,00'],
      [{pagos: [{metodo: 'efectivo', monto: 160}], recibido: 100}, 400, 'El efectivo recibido no alcanza para cubrir Bs 160,00'],
      [{pagos: [{metodo: 'qr', monto: 160}], recibido: 200}, 400, 'El monto recibido solo se usa con pago en efectivo'],
      [{pagos: [{metodo: 'qr', monto: 80}, {metodo: 'qr', monto: 80}]}, 400, 'No repita el método de pago'],
      [{pagos: []}, 400, 'Indique cómo paga el cliente'],
      [{pagos: [{metodo: 'tarjeta', monto: 160}]}, 400, 'Elija efectivo o QR'],
    ];
    for (const [body, status, message] of cases) {
      const res = await checkout('Mesa 2', body);
      expect(res.status).toBe(status);
      expect(JSON.stringify(res.body)).toContain(message);
    }
    expect((await checkout('Mesa 1', {pagos: [{metodo: 'qr', monto: 10}]})).status).toBe(404);
    const {rows} = await ctx.db.query("SELECT COUNT(*)::int AS total FROM venta WHERE estado = 'cobrada'");
    expect(rows[0].total).toBe(0);
  });

  it('resume las ventas cobradas hoy con totales por método', async () => {
    await start();
    await readyAll();
    await checkout('Mesa 2', {pagos: [{metodo: 'efectivo', monto: 100}, {metodo: 'qr', monto: 60}]});
    await checkout('Terraza 1', {pagos: [{metodo: 'qr', monto: 103}]});
    // Una venta cobrada ayer (hora del local) no cuenta para hoy
    await ctx.db.query("UPDATE venta SET cerrada_en = '2026-10-13T03:59:00Z' WHERE id_venta = (SELECT MIN(id_venta) FROM venta)");
    const res = await api('get', '/api/sales/today');
    expect(res.status).toBe(200);
    expect(res.body.hoy).toBe('2026-10-13');
    expect(res.body.ventas.map((item) => item.mesa)).toEqual(['Terraza 1']);
    expect(res.body.resumen).toEqual({cantidad: 1, total: 103, efectivo: 0, qr: 103});
  });

  it('cocina deja de ver los pedidos cobrados y el ticket inexistente responde 404', async () => {
    await start();
    await readyAll();
    await checkout('Terraza 1', {pagos: [{metodo: 'qr', monto: 103}]});
    const cocinero = await loginAs(ctx.app, 'r.sanchez');
    const kitchen = await api('get', '/api/kitchen/orders', cocinero);
    expect(kitchen.body.envios.map((item) => item.mesa)).toEqual(['Mesa 2']);
    expect((await api('get', '/api/sales/9999/receipt')).status).toBe(404);
  });

  it('lee el enlace de impuestos y solo Administración lo cambia', async () => {
    await start();
    const res = await api('get', '/api/settings');
    expect(res.body).toEqual({enlaceImpuestos: 'https://siat.impuestos.gob.bo/v2/launcher/'});
    expect((await api('put', '/api/settings').send({enlaceImpuestos: 'https://ejemplo.bo'})).status).toBe(403);
    const admin = await loginAs(ctx.app, 'admin');
    const invalid = await api('put', '/api/settings', admin).send({enlaceImpuestos: 'siat'});
    expect(invalid.status).toBe(400);
    const saved = await api('put', '/api/settings', admin).send({enlaceImpuestos: ' https://siat.impuestos.gob.bo/nuevo '});
    expect(saved.body).toEqual({enlaceImpuestos: 'https://siat.impuestos.gob.bo/nuevo'});
    expect((await api('get', '/api/settings')).body.enlaceImpuestos).toBe('https://siat.impuestos.gob.bo/nuevo');
  });
});
