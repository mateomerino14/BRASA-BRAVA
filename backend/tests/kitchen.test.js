import request from 'supertest';
import {afterEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';

const NOW = new Date('2026-10-14T00:00:00Z');

describe('Cocina: pedidos pendientes', () => {
  let ctx;
  let cocinero;

  const start = async () => {
    ctx = await createTestApp({clock: () => NOW});
    cocinero = await loginAs(ctx.app, 'r.sanchez');
  };
  afterEach(() => ctx.db.close());

  const api = (method, url, session = cocinero) => request(ctx.app)[method](url).set('authorization', session.authorization);
  const lineId = async (name, mesa) => (await ctx.db.query(
    `SELECT d.id_detalle AS id FROM venta_detalle d JOIN venta v ON v.id_venta = d.id_venta JOIN mesa m ON m.id_mesa = v.id_mesa
      WHERE d.nombre = $1 AND m.nombre = $2 ORDER BY d.id_detalle LIMIT 1`,
    [name, mesa],
  )).rows[0].id;
  const shipment = (body, mesa) => body.envios.find((item) => item.mesa === mesa);

  it('exige sesión y el permiso de cocina', async () => {
    await start();
    expect((await request(ctx.app).get('/api/kitchen/orders')).status).toBe(401);
    const cajero = await loginAs(ctx.app, 'a.romero');
    expect((await api('get', '/api/kitchen/orders', cajero)).status).toBe(403);
    expect(cocinero.user.permissions).toEqual(['home', 'familia', 'cocina']);
    const admin = await loginAs(ctx.app, 'admin');
    expect((await api('get', '/api/kitchen/orders', admin)).status).toBe(200);
  });

  it('lista los envíos de las ventas abiertas con su avance, del que más espera al más reciente', async () => {
    await start();
    const res = await api('get', '/api/kitchen/orders');
    expect(res.status).toBe(200);
    expect(res.body.envios.map((item) => item.mesa)).toEqual(['Terraza 1', 'Mesa 2']);
    expect(res.body.summary).toEqual({preparacion: 2, listos: 0, unidadesPendientes: 6});
    const terraza = shipment(res.body, 'Terraza 1');
    expect(terraza).toMatchObject({envio: 1, seccion: 'Terraza', mesero: 'Carlos Mendoza', unidades: 4, listas: 1, estado: 'preparacion', modificadoPor: null});
    expect(terraza.lineas.find((item) => item.nombre === 'Jugo de Naranja')).toMatchObject({cantidad: 1, listos: 1});
    const mesa2 = shipment(res.body, 'Mesa 2');
    expect(mesa2.lineas[0]).toMatchObject({nombre: 'Hamburguesa Clásica', exclusiones: [{producto: 'Hamburguesa Clásica', insumo: 'Tomate'}]});
    expect(mesa2.lineas.find((item) => item.tipo === 'promocion').productos.map((item) => item.nombre)).toEqual(['Doble Brava', 'Gaseosa 500 ml', 'Papas Fritas Clásicas']);
    expect(Object.keys(mesa2.lineas[0]).sort()).not.toContain('precioUnitario');
  });

  it('suma y resta unidades sin pasar de la cantidad ni bajar de cero', async () => {
    await start();
    const papas = await lineId('Papas Fritas Clásicas', 'Terraza 1');
    await api('patch', `/api/kitchen/lines/${papas}`).send({accion: 'sumar'});
    await api('patch', `/api/kitchen/lines/${papas}`).send({accion: 'sumar'});
    const full = await api('patch', `/api/kitchen/lines/${papas}`).send({accion: 'sumar'});
    expect(shipment(full.body, 'Terraza 1').lineas.find((item) => item.id === papas).listos).toBe(2);
    await api('patch', `/api/kitchen/lines/${papas}`).send({accion: 'ninguno'});
    const empty = await api('patch', `/api/kitchen/lines/${papas}`).send({accion: 'restar'});
    expect(shipment(empty.body, 'Terraza 1').lineas.find((item) => item.id === papas).listos).toBe(0);
    expect((await api('patch', `/api/kitchen/lines/${papas}`).send({accion: 'duplicar'})).status).toBe(400);
  });

  it('un envío queda listo cuando todas sus unidades lo están y vuelve a preparación si se desmarca una', async () => {
    await start();
    const venta = (await ctx.db.query("SELECT v.id_venta FROM venta v JOIN mesa m ON m.id_mesa = v.id_mesa WHERE m.nombre = 'Terraza 1'")).rows[0].id_venta;
    const done = await api('patch', `/api/kitchen/shipments/${venta}/1`).send({accion: 'todos'});
    expect(done.status).toBe(200);
    expect(shipment(done.body, 'Terraza 1')).toMatchObject({estado: 'listo', listas: 4});
    expect(done.body.summary).toEqual({preparacion: 1, listos: 1, unidadesPendientes: 3});
    expect(done.body.envios.map((item) => item.mesa)).toEqual(['Mesa 2', 'Terraza 1']);
    const back = await api('patch', `/api/kitchen/lines/${await lineId('Doble Brava', 'Terraza 1')}`).send({accion: 'restar'});
    expect(shipment(back.body, 'Terraza 1')).toMatchObject({estado: 'preparacion', listas: 3});
    expect((await api('patch', `/api/kitchen/shipments/${venta}/9`).send({accion: 'todos'})).status).toBe(404);
  });

  it('muestra los envíos nuevos como modificación y Caja ve las unidades listas', async () => {
    await start();
    const cajero = await loginAs(ctx.app, 'a.romero');
    const mesa2 = (await ctx.db.query("SELECT id_mesa FROM mesa WHERE nombre = 'Mesa 2'")).rows[0].id_mesa;
    const gaseosa = (await ctx.db.query("SELECT id_producto FROM producto WHERE nombre = 'Gaseosa 500 ml'")).rows[0].id_producto;
    const mesero = (await ctx.db.query("SELECT id_empleado FROM empleado WHERE alias = 'c.mendoza'")).rows[0].id_empleado;
    await api('post', `/api/sales/tables/${mesa2}/orders`, cajero).send({idMesero: mesero, items: [{tipo: 'producto', id: gaseosa, cantidad: 1, consumo: 'llevar'}]});
    const res = await api('get', '/api/kitchen/orders');
    const second = res.body.envios.find((item) => item.mesa === 'Mesa 2' && item.envio === 2);
    expect(second).toMatchObject({modificadoPor: 'a.romero', unidades: 1, listas: 0, lineas: [expect.objectContaining({nombre: 'Gaseosa 500 ml', consumo: 'llevar'})]});

    await api('patch', `/api/kitchen/lines/${second.lineas[0].id}`).send({accion: 'todos'});
    const table = await api('get', `/api/sales/tables/${mesa2}`, cajero);
    expect(table.body.venta.detalles.at(-1).listos).toBe(1);
    const floor = await api('get', '/api/sales/floor', cajero);
    const card = floor.body.secciones[0].mesas.find((item) => item.nombre === 'Mesa 2');
    expect(card.venta).toMatchObject({unidades: 6, listos: 3});
  });

  it('no cambia líneas de ventas cerradas', async () => {
    await start();
    const papas = await lineId('Papas Fritas Clásicas', 'Terraza 1');
    await ctx.db.query("UPDATE venta SET estado = 'cobrada' WHERE id_venta = (SELECT id_venta FROM venta_detalle WHERE id_detalle = $1)", [papas]);
    const res = await api('patch', `/api/kitchen/lines/${papas}`).send({accion: 'sumar'});
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('La línea no existe o su pedido ya se cerró');
    expect((await api('get', '/api/kitchen/orders')).body.envios.map((item) => item.mesa)).toEqual(['Mesa 2']);
  });
});
