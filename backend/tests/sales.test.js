import request from 'supertest';
import {afterEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';

// Martes 13 de octubre de 2026, 20:00 en La Paz (UTC−4): vigentes "Martes de Hamburguesas" y "Combo Brava"
const TUESDAY_NIGHT = new Date('2026-10-14T00:00:00Z');

describe('Caja: mesas y registro de pedidos', () => {
  let ctx;
  let cajero;

  const start = async () => {
    ctx = await createTestApp({clock: () => TUESDAY_NIGHT});
    cajero = await loginAs(ctx.app, 'a.romero');
  };
  afterEach(() => ctx.db.close());

  const api = (method, url, session = cajero) => request(ctx.app)[method](url).set('authorization', session.authorization);

  const idOf = async (table, column, name, where = 'nombre') => {
    const {rows} = await ctx.db.query(`SELECT ${column} AS id FROM ${table} WHERE ${where} = $1`, [name]);
    return rows[0].id;
  };
  const productId = (name) => idOf('producto', 'id_producto', name);
  const ingredientId = (name) => idOf('insumo', 'id_insumo', name);
  const tableId = (name) => idOf('mesa', 'id_mesa', name);
  const promotionId = (name) => idOf('promocion', 'id_promocion', name);
  const employeeId = (alias) => idOf('empleado', 'id_empleado', alias, 'alias');
  const countSales = async () => (await ctx.db.query('SELECT COUNT(*)::int AS total FROM venta')).rows[0].total;

  const order = async (mesa, items, {mesero = 'c.mendoza', session} = {}) => api('post', `/api/sales/tables/${await tableId(mesa)}/orders`, session)
    .send({idMesero: await employeeId(mesero), items});

  it('exige sesión y el permiso de caja', async () => {
    await start();
    expect((await request(ctx.app).get('/api/sales/floor')).status).toBe(401);
    const cocinero = await loginAs(ctx.app, 'r.sanchez');
    expect((await api('get', '/api/sales/floor', cocinero)).status).toBe(403);
    const mesero = await loginAs(ctx.app, 'c.mendoza');
    expect((await api('get', '/api/sales/floor', mesero)).status).toBe(200);
  });

  it('muestra el plano de mesas de las secciones activas con su ocupación', async () => {
    await start();
    const res = await api('get', '/api/sales/floor');
    expect(res.status).toBe(200);
    expect(res.body.secciones.map((item) => item.nombre)).toEqual(['Salón principal', 'Terraza', 'Barra']);
    expect(res.body.summary).toEqual({mesas: 17, ocupadas: 2, libres: 15, porCobrar: 263});
    const salon = res.body.secciones.find((item) => item.nombre === 'Salón principal');
    expect(salon.mesas.map((item) => item.nombre).slice(0, 3)).toEqual(['Mesa 1', 'Mesa 2', 'Mesa 3']);
    expect(salon.mesas[0].venta).toBeNull();
    expect(salon.mesas[1].venta).toMatchObject({total: 160, unidades: 5, mesero: 'Carlos Mendoza'});
    expect(new Date(salon.mesas[1].venta.abiertaEn).getTime()).toBe(TUESDAY_NIGHT.getTime() - 25 * 60 * 1000);
  });

  it('arma el catálogo del día con recetas, disponibilidad y promociones vigentes', async () => {
    await start();
    const res = await api('get', '/api/sales/catalog');
    expect(res.status).toBe(200);
    expect(res.body.hoy).toBe('2026-10-13');
    expect(res.body.categorias.map((item) => item.nombre)).toEqual(['Bebidas y Refrescos', 'Guarniciones y Extras', 'Hamburguesas']);
    const byName = Object.fromEntries(res.body.productos.map((item) => [item.nombre, item]));
    expect(byName['Hamburguesa Hawaiana']).toBeUndefined();
    expect(byName['Dúo Parrillero']).toBeUndefined();
    expect(byName['Cerveza Artesanal']).toMatchObject({disponible: false, porciones: 0});
    expect(byName['Hamburguesa Clásica']).toMatchObject({precio: 35, porciones: 0, categoria: 'Hamburguesas'});
    expect(byName['Hamburguesa Clásica'].ingredientes.map((item) => item.nombre)).toEqual(['Carne de res', 'Lechuga', 'Pan de hamburguesa', 'Queso cheddar', 'Tomate']);
    expect(byName['Aros de Cebolla']).toMatchObject({porciones: null, ingredientes: []});
    const promotions = Object.fromEntries(res.body.promociones.map((item) => [item.nombre, item]));
    expect(Object.keys(promotions).sort()).toEqual(['Combo Brava', 'Martes de Hamburguesas']);
    expect(promotions['Martes de Hamburguesas']).toMatchObject({tipo: 'descuento', precio: 58.4, precioRegular: 73, ahorro: 14.6});
    expect(promotions['Combo Brava'].productos.map((item) => item.nombre)).toEqual(['Doble Brava', 'Gaseosa 500 ml', 'Papas Fritas Clásicas']);
    expect(promotions['Combo Brava'].productos[0].ingredientes.map((item) => item.nombre)).toEqual(['Carne de res', 'Pan de hamburguesa', 'Queso cheddar']);
  });

  it('oculta las promociones con productos que no están a la venta', async () => {
    await start();
    await ctx.db.query("UPDATE producto SET disponible = FALSE WHERE nombre = 'Gaseosa 500 ml'");
    const res = await api('get', '/api/sales/catalog');
    expect(res.body.promociones.map((item) => item.nombre)).toEqual(['Martes de Hamburguesas']);
  });

  it('lista como meseros a los empleados activos con acceso a Caja', async () => {
    await start();
    const res = await api('get', '/api/sales/waiters');
    expect(res.body.meseros.map((item) => `${item.nombre} (${item.cargo})`)).toEqual([
      'Andrea Romero (Cajero)',
      'Carlos Mendoza (Mesero)',
      'Marco Vargas (Administrador)',
    ]);
  });

  it('devuelve una mesa libre y una ocupada con sus líneas e ingredientes quitados', async () => {
    await start();
    const free = await api('get', `/api/sales/tables/${await tableId('Mesa 1')}`);
    expect(free.status).toBe(200);
    expect(free.body).toMatchObject({mesa: {nombre: 'Mesa 1', capacidad: 4, seccion: {nombre: 'Salón principal'}}, venta: null});
    const busy = await api('get', `/api/sales/tables/${await tableId('Mesa 2')}`);
    expect(busy.body.venta).toMatchObject({total: 160, envios: 1, cajero: 'a.romero', mesero: {nombre: 'Carlos Mendoza'}});
    expect(busy.body.venta.numero).toBe(busy.body.venta.id);
    expect(busy.body.venta.detalles).toHaveLength(4);
    expect(busy.body.venta.detalles[0]).toMatchObject({
      tipo: 'producto', nombre: 'Hamburguesa Clásica', precioUnitario: 35, cantidad: 1, subtotal: 35, consumo: 'local', envio: 1,
      exclusiones: [{producto: 'Hamburguesa Clásica', insumo: 'Tomate'}],
    });
    expect(busy.body.venta.detalles[2]).toMatchObject({tipo: 'promocion', nombre: 'Combo Brava', precioUnitario: 70});
  });

  it('abre una venta en una mesa libre con precios de hoy, consumo e ingredientes quitados', async () => {
    await start();
    const before = await countSales();
    const clasica = await productId('Hamburguesa Clásica');
    const cheese = await productId('Cheeseburger');
    const res = await order('Mesa 1', [
      {tipo: 'producto', id: clasica, cantidad: 2, consumo: 'local', exclusiones: [{idProducto: clasica, idInsumo: await ingredientId('Lechuga')}]},
      {tipo: 'promocion', id: await promotionId('Martes de Hamburguesas'), cantidad: 1, consumo: 'llevar', exclusiones: [{idProducto: cheese, idInsumo: await ingredientId('Queso cheddar')}]},
    ]);
    expect(res.status).toBe(201);
    expect(res.body.nueva).toBe(true);
    expect(res.body.venta).toMatchObject({total: 128.4, envios: 1, cajero: 'a.romero', mesero: {nombre: 'Carlos Mendoza'}});
    expect(res.body.venta.detalles).toEqual([
      expect.objectContaining({nombre: 'Hamburguesa Clásica', cantidad: 2, subtotal: 70, consumo: 'local', envio: 1, exclusiones: [expect.objectContaining({insumo: 'Lechuga'})]}),
      expect.objectContaining({tipo: 'promocion', nombre: 'Martes de Hamburguesas', precioUnitario: 58.4, consumo: 'llevar', exclusiones: [expect.objectContaining({producto: 'Cheeseburger', insumo: 'Queso cheddar'})]}),
    ]);
    expect(await countSales()).toBe(before + 1);
    expect((await api('get', '/api/sales/floor')).body.summary).toMatchObject({ocupadas: 3, libres: 14});
  });

  it('suma un nuevo envío a la venta abierta de una mesa ocupada sin crear otra venta', async () => {
    await start();
    const before = (await api('get', `/api/sales/tables/${await tableId('Mesa 2')}`)).body.venta;
    const res = await order('Mesa 2', [{tipo: 'producto', id: await productId('Gaseosa 500 ml'), cantidad: 1, consumo: 'local'}], {mesero: 'admin'});
    expect(res.status).toBe(201);
    expect(res.body.nueva).toBe(false);
    expect(res.body.venta).toMatchObject({id: before.id, total: 170, envios: 2, mesero: {nombre: 'Carlos Mendoza'}});
    const last = res.body.venta.detalles.at(-1);
    expect(last).toMatchObject({nombre: 'Gaseosa 500 ml', envio: 2, mesero: {nombre: 'Marco Vargas'}});
    expect(await countSales()).toBe(2);
  });

  it('guarda el precio del momento aunque el producto cambie después', async () => {
    await start();
    await order('Mesa 1', [{tipo: 'producto', id: await productId('Cheeseburger'), cantidad: 1, consumo: 'local'}]);
    await ctx.db.query("UPDATE producto SET precio = 99 WHERE nombre = 'Cheeseburger'");
    const res = await api('get', `/api/sales/tables/${await tableId('Mesa 1')}`);
    expect(res.body.venta).toMatchObject({total: 38, detalles: [expect.objectContaining({precioUnitario: 38})]});
  });

  it('registra al DIRECTORIO como cajero y descarta ingredientes repetidos', async () => {
    await start();
    const directorio = await loginAs(ctx.app, 'DIRECTORIO');
    const clasica = await productId('Hamburguesa Clásica');
    const tomate = {idProducto: clasica, idInsumo: await ingredientId('Tomate')};
    const res = await order('Mesa 1', [{tipo: 'producto', id: clasica, cantidad: 1, consumo: 'local', exclusiones: [tomate, tomate]}], {session: directorio});
    expect(res.status).toBe(201);
    expect(res.body.venta.cajero).toBe('DIRECTORIO');
    expect(res.body.venta.detalles[0].exclusiones).toHaveLength(1);
    const {rows} = await ctx.db.query('SELECT id_cajero FROM venta WHERE id_venta = $1', [res.body.venta.id]);
    expect(rows[0].id_cajero).toBeNull();
  });

  it('rechaza meseros, productos, promociones, ingredientes y mesas no válidos sin registrar nada', async () => {
    await start();
    const before = await countSales();
    const clasica = await productId('Hamburguesa Clásica');
    const line = {tipo: 'producto', id: clasica, cantidad: 1, consumo: 'local'};
    const cases = [
      [await order('Mesa 1', [line], {mesero: 'r.sanchez'}), 400, 'Elija un mesero activo'],
      [await order('Mesa 1', [line], {mesero: 'j.ortiz'}), 400, 'Elija un mesero activo'],
      [await order('Mesa 1', []), 400, 'Agregue al menos un producto'],
      [await order('Mesa 1', [{...line, cantidad: 0}]), 400, 'La cantidad debe ser de 1 a 99'],
      [await order('Mesa 1', [{...line, id: await productId('Cerveza Artesanal')}]), 400, 'Cerveza Artesanal no está disponible por ahora'],
      [await order('Mesa 1', [{...line, id: await productId('Hamburguesa Hawaiana')}]), 400, 'Un producto del pedido ya no está a la venta'],
      [await order('Mesa 1', [{...line, tipo: 'promocion', id: await promotionId('Happy Hour Cervecero')}]), 400, 'Una promoción del pedido no está vigente hoy'],
      [await order('Mesa 1', [{...line, exclusiones: [{idProducto: clasica, idInsumo: await ingredientId('Tocino')}]}]), 400, 'Hay ingredientes quitados que no son de la receta del producto'],
      [await order('Mesa 1', [{...line, exclusiones: [{idProducto: await productId('Brava BBQ'), idInsumo: await ingredientId('Tocino')}]}]), 400, 'Hay ingredientes quitados que no son de la receta del producto'],
      [await order('VIP 1', [line]), 404, 'Mesa no encontrada o deshabilitada'],
    ];
    for (const [res, status, message] of cases) {
      expect(res.status).toBe(status);
      expect(res.body.message).toBe(message);
    }
    expect((await api('post', '/api/sales/tables/9999/orders').send({idMesero: 1, items: [line]})).status).toBe(404);
    expect(await countSales()).toBe(before);
  });

  it('dos envíos a la vez para una mesa libre quedan en una sola venta', async () => {
    await start();
    const gaseosa = {tipo: 'producto', id: await productId('Gaseosa 500 ml'), cantidad: 1, consumo: 'local'};
    const [first, second] = await Promise.all([order('Mesa 1', [gaseosa]), order('Mesa 1', [gaseosa])]);
    expect([first.status, second.status]).toEqual([201, 201]);
    expect(first.body.venta.id).toBe(second.body.venta.id);
    const res = await api('get', `/api/sales/tables/${await tableId('Mesa 1')}`);
    expect(res.body.venta).toMatchObject({total: 20, envios: 2});
  });

  it('no deja dar de baja mesas ni secciones con ventas abiertas', async () => {
    await start();
    const admin = await loginAs(ctx.app, 'admin');
    const terraza = await idOf('seccion', 'id_seccion', 'Terraza');
    const off = await api('patch', `/api/sections/${terraza}/status`, admin).send({activo: false});
    expect(off.status).toBe(409);
    expect(off.body.message).toContain('Terraza 1');
    const salon = await idOf('seccion', 'id_seccion', 'Salón principal');
    const current = (await api('get', `/api/sections/${salon}`, admin)).body.section;
    const withoutMesa2 = current.mesas.filter((item) => item.nombre !== 'Mesa 2');
    const blocked = await api('put', `/api/sections/${salon}`, admin).send({nombre: current.nombre, descripcion: current.descripcion, mesas: withoutMesa2});
    expect(blocked.status).toBe(409);
    expect(blocked.body.message).toContain('Mesa 2');
    const withoutMesa3 = current.mesas.filter((item) => item.nombre !== 'Mesa 3');
    const allowed = await api('put', `/api/sections/${salon}`, admin).send({nombre: current.nombre, descripcion: current.descripcion, mesas: withoutMesa3});
    expect(allowed.status).toBe(200);
  });

  const stockOf = async (name) => Number((await ctx.db.query('SELECT stock_actual FROM insumo WHERE nombre = $1', [name])).rows[0].stock_actual);
  const salesMovements = async (name) => (await ctx.db.query(
    `SELECT m.cantidad, m.stock_resultante, m.motivo, m.responsable FROM movimiento_stock m JOIN insumo i ON i.id_insumo = m.id_insumo
      WHERE i.nombre = $1 AND m.tipo = 'venta' ORDER BY m.id_movimiento`,
    [name],
  )).rows.map((row) => ({...row, cantidad: Number(row.cantidad), stock_resultante: Number(row.stock_resultante)}));

  it('descuenta del stock la receta de cada envío sin los ingredientes quitados, también en combos', async () => {
    await start();
    const clasica = await productId('Hamburguesa Clásica');
    const doble = await productId('Doble Brava');
    const res = await order('Mesa 1', [
      {tipo: 'producto', id: clasica, cantidad: 2, consumo: 'local', exclusiones: [{idProducto: clasica, idInsumo: await ingredientId('Lechuga')}]},
      {tipo: 'promocion', id: await promotionId('Combo Brava'), cantidad: 1, consumo: 'local', exclusiones: [{idProducto: doble, idInsumo: await ingredientId('Queso cheddar')}]},
    ]);
    expect(res.status).toBe(201);
    expect(res.body.sinStock).toEqual([]);
    expect(res.body.envio).toBe(1);
    const expected = {'Carne de res': 11.4, 'Pan de hamburguesa': 37, 'Queso cheddar': 1.44, 'Tomate': 2.92, 'Papas': 19.75, 'Aceite': 5.95, 'Gaseosa 500 ml': 47, 'Lechuga': 0};
    for (const [name, value] of Object.entries(expected)) {
      expect(await stockOf(name)).toBeCloseTo(value, 3);
    }
    const [carne] = await salesMovements('Carne de res');
    expect(carne).toEqual({cantidad: -0.6, stock_resultante: 11.4, motivo: `Venta Nº ${res.body.venta.numero} · Mesa 1 · envío 1`, responsable: 'a.romero'});
    expect(await salesMovements('Lechuga')).toEqual([]);
  });

  it('nunca bloquea la venta: deja en 0 lo que no alcanza y avisa qué insumos faltaron', async () => {
    await start();
    const res = await order('Mesa 1', [
      {tipo: 'producto', id: await productId('Cheeseburger'), cantidad: 30, consumo: 'local'},
      {tipo: 'producto', id: await productId('Hamburguesa Clásica'), cantidad: 1, consumo: 'local'},
    ]);
    expect(res.status).toBe(201);
    expect(res.body.venta.total).toBe(30 * 38 + 35);
    expect(res.body.sinStock.sort()).toEqual(['Lechuga', 'Queso cheddar']);
    expect(await stockOf('Queso cheddar')).toBe(0);
    expect(await salesMovements('Queso cheddar')).toEqual([expect.objectContaining({cantidad: -1.5, stock_resultante: 0, motivo: expect.stringContaining('(stock insuficiente)')})]);
    expect(await salesMovements('Lechuga')).toEqual([]);
  });

  it('no toca el stock de los insumos dados de baja', async () => {
    await start();
    await ctx.db.query("UPDATE insumo SET activo = FALSE WHERE nombre = 'Tomate'");
    await order('Mesa 1', [{tipo: 'producto', id: await productId('Hamburguesa Clásica'), cantidad: 1, consumo: 'local'}]);
    expect(await stockOf('Tomate')).toBe(3);
    expect(await stockOf('Carne de res')).toBeCloseTo(11.85, 3);
  });

  it('guarda cada envío como comanda y marca la venta como modificada desde el segundo', async () => {
    await start();
    const opened = await order('Mesa 1', [{tipo: 'producto', id: await productId('Gaseosa 500 ml'), cantidad: 1, consumo: 'local'}]);
    expect(opened.body.venta).toMatchObject({modificado: false, modificadoPor: null, comandas: [expect.objectContaining({envio: 1, cajero: 'a.romero', mesero: expect.objectContaining({nombre: 'Carlos Mendoza'})})]});

    const admin = await loginAs(ctx.app, 'admin');
    const res = await order('Mesa 2', [{tipo: 'producto', id: await productId('Jugo de Naranja'), cantidad: 1, consumo: 'llevar'}], {mesero: 'admin', session: admin});
    expect(res.body.envio).toBe(2);
    expect(res.body.venta).toMatchObject({modificado: true, modificadoPor: 'admin'});
    expect(res.body.venta.comandas.map((item) => [item.envio, item.cajero, item.mesero.nombre])).toEqual([[1, 'a.romero', 'Carlos Mendoza'], [2, 'admin', 'Marco Vargas']]);
    const combo = res.body.venta.detalles.find((item) => item.nombre === 'Combo Brava');
    expect(combo.productos).toEqual([{nombre: 'Doble Brava', cantidad: 1}, {nombre: 'Gaseosa 500 ml', cantidad: 1}, {nombre: 'Papas Fritas Clásicas', cantidad: 1}]);
    expect(res.body.venta.detalles[0].productos).toEqual([]);
  });
});
