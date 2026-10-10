import request from 'supertest';
import {afterEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';

// Martes 13 de octubre de 2026, 11:00 en La Paz (UTC−4)
const TUESDAY = new Date('2026-10-13T15:00:00Z');
// Miércoles 14 a las 23:30 en La Paz: en UTC ya es jueves, pero para el local sigue siendo miércoles
const WEDNESDAY_NIGHT = new Date('2026-10-15T03:30:00Z');

describe('Gestión de promociones', () => {
  let ctx;
  let admin;

  const start = async (now = TUESDAY) => {
    ctx = await createTestApp({clock: () => now});
    admin = await loginAs(ctx.app, 'admin');
  };
  afterEach(() => ctx.db.close());

  const api = (method, url) => request(ctx.app)[method](url).set('authorization', admin.authorization);

  const productId = async (name) => {
    const {rows} = await ctx.db.query('SELECT id_producto FROM producto WHERE nombre = $1', [name]);
    return rows[0].id_producto;
  };

  const promotionId = async (name) => {
    const {rows} = await ctx.db.query('SELECT id_promocion FROM promocion WHERE nombre = $1', [name]);
    return rows[0].id_promocion;
  };

  const combo = async (overrides = {}) => ({
    nombre: 'Combo Familiar',
    descripcion: 'Para compartir',
    tipo: 'combo',
    valor: '120,00',
    fechaInicio: '2026-10-13',
    fechaFin: '',
    dias: '1111111',
    productos: [{idProducto: await productId('Doble Brava'), cantidad: 2}, {idProducto: await productId('Papas Fritas Clásicas'), cantidad: 2}],
    ...overrides,
  });

  it('exige sesión y el permiso de promociones', async () => {
    await start();
    expect((await request(ctx.app).get('/api/promotions')).status).toBe(401);
    const cajero = await loginAs(ctx.app, 'a.romero');
    expect((await request(ctx.app).get('/api/promotions').set('authorization', cajero.authorization)).status).toBe(403);
  });

  it('calcula vigencia del día, precios y resumen', async () => {
    await start();
    const res = await api('get', '/api/promotions?pageSize=10');
    expect(res.status).toBe(200);
    expect(res.body.hoy).toBe('2026-10-13');
    expect(res.body.summary).toEqual({vigentes: 2, programadas: 1, vencidas: 1});
    const byName = Object.fromEntries(res.body.items.map((item) => [item.nombre, item]));
    expect(byName['Martes de Hamburguesas']).toMatchObject({tipo: 'descuento', valor: 20, vigencia: 'vigente', precioRegular: 73, precioPromocion: 58.4, ahorro: 14.6, dias: '0010000', fechaFin: null});
    expect(byName['Combo Brava']).toMatchObject({tipo: 'combo', precioRegular: 83, precioPromocion: 70, ahorro: 13, vigencia: 'vigente', fechaInicio: '2026-10-06', fechaFin: '2026-11-12'});
    expect(byName['Combo Brava'].productos.map((item) => [item.nombre, item.cantidad])).toEqual([['Doble Brava', 1], ['Gaseosa 500 ml', 1], ['Papas Fritas Clásicas', 1]]);
    expect(byName['Happy Hour Cervecero'].vigencia).toBe('programada');
    expect(byName['Promo Aniversario']).toMatchObject({vigencia: 'vencida', precioRegular: 114, precioPromocion: 99});
    expect(byName['Jueves de Jugos'].vigencia).toBe('inactiva');
  });

  it('usa el día del local: a las 23:30 del miércoles el martes ya no aplica', async () => {
    await start(WEDNESDAY_NIGHT);
    const res = await api('get', '/api/promotions?pageSize=10');
    expect(res.body.hoy).toBe('2026-10-14');
    const martes = res.body.items.find((item) => item.nombre === 'Martes de Hamburguesas');
    expect(martes.vigencia).toBe('otro_dia');
    expect(res.body.summary.vigentes).toBe(1);
  });

  it('filtra por vigencia, tipo y búsqueda de producto', async () => {
    await start();
    const current = await api('get', '/api/promotions?vigencia=vigentes&sort=nombre');
    expect(current.body.items.map((item) => item.nombre)).toEqual(['Combo Brava', 'Martes de Hamburguesas']);
    const scheduled = await api('get', '/api/promotions?vigencia=programadas');
    expect(scheduled.body.items.map((item) => item.nombre)).toEqual(['Happy Hour Cervecero']);
    const combos = await api('get', '/api/promotions?tipo=combo');
    expect(combos.body.total).toBe(2);
    const byProduct = await api('get', '/api/promotions?search=cheeseburger');
    expect(byProduct.body.items.map((item) => item.nombre)).toEqual(['Martes de Hamburguesas']);
    expect((await api('get', '/api/promotions?vigencia=siempre')).status).toBe(400);
  });

  it('lista solo productos activos como opciones', async () => {
    await start();
    const res = await api('get', '/api/promotions/product-options');
    const names = res.body.productos.map((item) => item.nombre);
    expect(names).toContain('Doble Brava');
    expect(names).not.toContain('Hamburguesa Hawaiana');
    expect(res.body.productos.find((item) => item.nombre === 'Doble Brava')).toMatchObject({precio: 58, categoria: 'Hamburguesas'});
  });

  it('registra un combo más barato que por separado', async () => {
    await start();
    const res = await api('post', '/api/promotions').send(await combo());
    expect(res.status).toBe(201);
    expect(res.body.promotion).toMatchObject({nombre: 'Combo Familiar', precioRegular: 146, precioPromocion: 120, ahorro: 26, fechaFin: null, vigencia: 'vigente'});
  });

  it('valida reglas de combo, descuento, fechas, días y productos', async () => {
    await start();
    const expensive = await api('post', '/api/promotions').send(await combo({valor: 200}));
    expect(expensive.body.message).toBe('El precio del combo debe ser menor que comprar los productos por separado');
    const single = await api('post', '/api/promotions').send(await combo({productos: [{idProducto: await productId('Doble Brava'), cantidad: 1}]}));
    expect(single.body.message).toBe('Un combo necesita al menos 2 productos');
    const percent = await api('post', '/api/promotions').send(await combo({tipo: 'descuento', valor: 95}));
    expect(percent.body.message).toBe('El descuento debe ser un porcentaje entero de 1 a 90');
    const dates = await api('post', '/api/promotions').send(await combo({fechaFin: '2026-10-01'}));
    expect(dates.body.message).toBe('La fecha de fin no puede ser anterior al inicio');
    const days = await api('post', '/api/promotions').send(await combo({dias: '0000000'}));
    expect(days.body.message).toBe('Elija al menos un día de la semana');
    const inactive = await api('post', '/api/promotions').send(await combo({productos: [{idProducto: await productId('Hamburguesa Hawaiana'), cantidad: 2}]}));
    expect(inactive.body.message).toBe('Hay productos inexistentes o dados de baja en la promoción');
    const duplicate = await api('post', '/api/promotions').send(await combo({nombre: 'combo brava'}));
    expect(duplicate.status).toBe(409);
  });

  it('modifica una promoción, la da de baja y responde 404', async () => {
    await start();
    const id = await promotionId('Martes de Hamburguesas');
    const res = await api('put', `/api/promotions/${id}`).send({
      nombre: 'Martes y Jueves de Hamburguesas',
      tipo: 'descuento',
      valor: 25,
      fechaInicio: '2026-09-13',
      fechaFin: '2026-12-31',
      dias: '0010100',
      productos: [{idProducto: await productId('Hamburguesa Clásica')}],
    });
    expect(res.status).toBe(200);
    expect(res.body.promotion).toMatchObject({valor: 25, precioRegular: 35, precioPromocion: 26.25, dias: '0010100', fechaFin: '2026-12-31'});
    const off = await api('patch', `/api/promotions/${id}/status`).send({activo: false});
    expect(off.body.promotion.vigencia).toBe('inactiva');
    expect((await api('get', '/api/promotions/999')).status).toBe(404);
  });
});
