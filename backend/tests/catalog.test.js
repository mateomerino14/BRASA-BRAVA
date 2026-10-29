import request from 'supertest';
import {afterEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';

// Martes 13 de octubre de 2026 en La Paz
const TUESDAY = new Date('2026-10-13T15:00:00Z');

describe('Familia: catálogo del local', () => {
  let ctx;
  let cocinero;

  const start = async () => {
    ctx = await createTestApp({clock: () => TUESDAY});
    cocinero = await loginAs(ctx.app, 'r.sanchez');
  };
  afterEach(() => ctx.db.close());

  const api = (url) => request(ctx.app).get(url).set('authorization', cocinero.authorization);
  const productId = async (name) => (await ctx.db.query('SELECT id_producto FROM producto WHERE nombre = $1', [name])).rows[0].id_producto;

  it('exige sesión y lo ve cualquier cargo con Familia', async () => {
    await start();
    expect((await request(ctx.app).get('/api/catalog')).status).toBe(401);
    expect((await api('/api/catalog')).status).toBe(200);
  });

  it('muestra categorías con subcategorías y los productos activos con disponibilidad y porciones', async () => {
    await start();
    const res = await api('/api/catalog');
    expect(res.body.hoy).toBe('2026-10-13');
    expect(res.body.categorias.map((item) => item.nombre)).toEqual(['Bebidas y Refrescos', 'Guarniciones y Extras', 'Hamburguesas']);
    expect(res.body.categorias[2].subcategorias.map((item) => item.nombre)).toEqual(['Clásicas', 'Especiales', 'Doble Carne']);
    const names = res.body.productos.map((item) => item.nombre);
    expect(names).not.toContain('Hamburguesa Hawaiana');
    expect(names).not.toContain('Dúo Parrillero');
    const byName = Object.fromEntries(res.body.productos.map((item) => [item.nombre, item]));
    expect(byName['Cerveza Artesanal']).toMatchObject({disponible: false, porciones: 0, subcategoria: 'Cervezas'});
    expect(byName['Doble Brava']).toMatchObject({precio: 58, porciones: 25, categoria: 'Hamburguesas', subcategoria: 'Doble Carne'});
    expect(byName['Aros de Cebolla'].porciones).toBeNull();
  });

  it('lista las promociones de hoy primero, luego las programadas, sin vencidas ni de baja', async () => {
    await start();
    const res = await api('/api/catalog');
    expect(res.body.promociones.map((item) => [item.nombre, item.vigencia])).toEqual([
      ['Combo Brava', 'vigente'],
      ['Martes de Hamburguesas', 'vigente'],
      ['Happy Hour Cervecero', 'programada'],
    ]);
    expect(res.body.promociones[0]).toMatchObject({precio: 70, precioRegular: 83, ahorro: 13, dias: '1111111', disponible: true});
    expect(res.body.promociones[0].productos.map((item) => `${item.cantidad} ${item.nombre}`)).toEqual(['1 Doble Brava', '1 Gaseosa 500 ml', '1 Papas Fritas Clásicas']);
    expect(res.body.promociones[2].disponible).toBe(false);
  });

  it('detalla la receta con lo que usa por porción, el stock y cuántas alcanzan', async () => {
    await start();
    const res = await api(`/api/catalog/products/${await productId('Hamburguesa Clásica')}`);
    expect(res.status).toBe(200);
    expect(res.body.producto).toMatchObject({nombre: 'Hamburguesa Clásica', porciones: 0});
    const byName = Object.fromEntries(res.body.producto.receta.map((item) => [item.nombre, item]));
    expect(byName['Carne de res']).toEqual({id: expect.any(Number), nombre: 'Carne de res', unidad: 'kg', cantidad: 0.15, stock: 12, activo: true, nivel: 'suficiente', alcanza: 80});
    expect(byName.Lechuga).toMatchObject({stock: 0, nivel: 'sin_stock', alcanza: 0});
    expect(byName['Queso cheddar']).toMatchObject({nivel: 'bajo', alcanza: 50});
  });

  it('cuenta como sin stock un insumo dado de baja y no muestra productos de baja', async () => {
    await start();
    await ctx.db.query("UPDATE insumo SET activo = FALSE WHERE nombre = 'Carne de res'");
    const res = await api(`/api/catalog/products/${await productId('Doble Brava')}`);
    expect(res.body.producto.receta.find((item) => item.nombre === 'Carne de res')).toMatchObject({activo: false, nivel: 'sin_stock', alcanza: 0});
    expect(res.body.producto.porciones).toBe(0);
    expect((await api(`/api/catalog/products/${await productId('Hamburguesa Hawaiana')}`)).status).toBe(404);
  });
});
