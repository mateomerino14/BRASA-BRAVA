import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';

describe('Gestión de stock', () => {
  let ctx;
  let admin;

  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await loginAs(ctx.app, 'admin');
  });
  afterEach(() => ctx.db.close());

  // Ejecuta una petición autenticada como administrador
  const api = (method, url, session = admin) => request(ctx.app)[method](url).set('authorization', session.authorization);

  // Busca el id de un insumo por nombre
  const idOf = async (name) => {
    const {rows} = await ctx.db.query('SELECT id_insumo FROM insumo WHERE nombre = $1', [name]);
    return rows[0].id_insumo;
  };

  it('exige sesión y el permiso de stock', async () => {
    expect((await request(ctx.app).get('/api/ingredients')).status).toBe(401);
    const cajero = await loginAs(ctx.app, 'a.romero');
    expect((await api('get', '/api/ingredients', cajero)).status).toBe(403);
  });

  it('lista con nivel calculado y resumen de alertas', async () => {
    const res = await api('get', '/api/ingredients?pageSize=20');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(12);
    expect(res.body.summary).toEqual({total: 12, bajo: 1, sinStock: 2});
    const byName = Object.fromEntries(res.body.items.map((item) => [item.nombre, item]));
    expect(byName['Carne de res']).toMatchObject({unidad: 'kg', stockActual: 12, stockMinimo: 5, nivel: 'suficiente', activo: true});
    expect(byName['Queso cheddar']).toMatchObject({stockActual: 1.5, nivel: 'bajo'});
    expect(byName.Lechuga.nivel).toBe('sin_stock');
  });

  it('filtra por nivel y ordena por stock', async () => {
    const low = await api('get', '/api/ingredients?nivel=bajo&sort=nombre');
    expect(low.body.items.map((item) => item.nombre)).toEqual(['Queso cheddar']);
    const empty = await api('get', '/api/ingredients?nivel=sin_stock');
    expect(empty.body.total).toBe(2);
    const most = await api('get', '/api/ingredients?sort=stock&dir=desc&pageSize=1');
    expect(most.body.items[0].nombre).toBe('Gaseosa 500 ml');
    expect((await api('get', '/api/ingredients?nivel=critico')).status).toBe(400);
  });

  it('registra un insumo con stock inicial y lo deja en el historial', async () => {
    const res = await api('post', '/api/ingredients').send({nombre: 'Jalapeños', unidad: 'kg', stockMinimo: '0,5', stockInicial: '2,25'});
    expect(res.status).toBe(201);
    expect(res.body.ingredient).toMatchObject({nombre: 'Jalapeños', stockActual: 2.25, stockMinimo: 0.5, nivel: 'suficiente'});
    const history = await api('get', `/api/ingredients/${res.body.ingredient.id}/movements`);
    expect(history.body.items).toEqual([expect.objectContaining({tipo: 'entrada', cantidad: 2.25, stockResultante: 2.25, motivo: 'Stock inicial', responsable: 'admin'})]);
  });

  it('valida nombre, unidad, cantidades y duplicados', async () => {
    const bad = await api('post', '/api/ingredients').send({nombre: 'Sal', unidad: 'taza', stockMinimo: 1});
    expect(bad.status).toBe(400);
    expect(bad.body.message).toBe('Seleccione la unidad de medida');
    const decimals = await api('post', '/api/ingredients').send({nombre: 'Sal', unidad: 'kg', stockMinimo: 0.0001});
    expect(decimals.body.message).toBe('El stock mínimo admite hasta 3 decimales');
    const negative = await api('post', '/api/ingredients').send({nombre: 'Sal', unidad: 'kg', stockMinimo: -1});
    expect(negative.body.message).toBe('El stock mínimo no puede ser negativo');
    const duplicate = await api('post', '/api/ingredients').send({nombre: 'TOMATE', unidad: 'kg', stockMinimo: 1});
    expect(duplicate.status).toBe(409);
  });

  it('registra entradas y salidas sin dejar el stock negativo', async () => {
    const id = await idOf('Carne de res');
    const entry = await api('post', `/api/ingredients/${id}/movements`).send({tipo: 'entrada', cantidad: '3,5', motivo: 'Compra del día'});
    expect(entry.status).toBe(201);
    expect(entry.body.ingredient.stockActual).toBe(15.5);
    const out = await api('post', `/api/ingredients/${id}/movements`).send({tipo: 'salida', cantidad: 0.3, motivo: 'Merma'});
    expect(out.body.ingredient.stockActual).toBe(15.2);
    const tooMuch = await api('post', `/api/ingredients/${id}/movements`).send({tipo: 'salida', cantidad: 100});
    expect(tooMuch.status).toBe(400);
    expect(tooMuch.body.message).toBe('No hay suficiente stock para esa salida');
    const zero = await api('post', `/api/ingredients/${id}/movements`).send({tipo: 'entrada', cantidad: 0});
    expect(zero.body.message).toBe('La cantidad debe ser mayor a 0');
    const history = await api('get', `/api/ingredients/${id}/movements?pageSize=2`);
    expect(history.body.total).toBe(3);
    expect(history.body.items.map((item) => [item.tipo, item.cantidad, item.stockResultante])).toEqual([['salida', -0.3, 15.2], ['entrada', 3.5, 15.5]]);
  });

  it('el ajuste fija el conteo real y registra la diferencia', async () => {
    const id = await idOf('Papas');
    const res = await api('post', `/api/ingredients/${id}/movements`).send({tipo: 'ajuste', cantidad: 17.75, motivo: 'Conteo semanal'});
    expect(res.body.ingredient.stockActual).toBe(17.75);
    const toZero = await api('post', `/api/ingredients/${id}/movements`).send({tipo: 'ajuste', cantidad: 0});
    expect(toZero.body.ingredient).toMatchObject({stockActual: 0, nivel: 'sin_stock'});
    const history = await api('get', `/api/ingredients/${id}/movements`);
    expect(history.body.items.slice(0, 2).map((item) => item.cantidad)).toEqual([-17.75, -2.25]);
  });

  it('guarda como responsable al empleado o al DIRECTORIO', async () => {
    const directorio = await loginAs(ctx.app, 'DIRECTORIO');
    const id = await idOf('Naranja');
    await api('post', `/api/ingredients/${id}/movements`, directorio).send({tipo: 'entrada', cantidad: 1});
    const {rows} = await ctx.db.query('SELECT responsable, id_empleado FROM movimiento_stock WHERE id_insumo = $1 ORDER BY id_movimiento DESC LIMIT 1', [id]);
    expect(rows[0]).toEqual({responsable: 'DIRECTORIO', id_empleado: null});
  });

  it('no cambia la unidad si hay movimientos, pero sí el nombre y el mínimo', async () => {
    const id = await idOf('Tomate');
    const unit = await api('put', `/api/ingredients/${id}`).send({nombre: 'Tomate', unidad: 'g', stockMinimo: 1});
    expect(unit.status).toBe(409);
    const ok = await api('put', `/api/ingredients/${id}`).send({nombre: 'Tomate perita', unidad: 'kg', stockMinimo: 4});
    expect(ok.body.ingredient).toMatchObject({nombre: 'Tomate perita', stockMinimo: 4, nivel: 'bajo'});
    const fresh = await api('post', '/api/ingredients').send({nombre: 'Sal', unidad: 'kg', stockMinimo: 1});
    const changed = await api('put', `/api/ingredients/${fresh.body.ingredient.id}`).send({nombre: 'Sal', unidad: 'g', stockMinimo: 500});
    expect(changed.body.ingredient.unidad).toBe('g');
  });

  it('da de baja, no admite movimientos en insumos de baja y responde 404', async () => {
    const id = await idOf('Aceite');
    const off = await api('patch', `/api/ingredients/${id}/status`).send({activo: false});
    expect(off.body.ingredient.activo).toBe(false);
    const blocked = await api('post', `/api/ingredients/${id}/movements`).send({tipo: 'entrada', cantidad: 1});
    expect(blocked.body.message).toBe('Reactive el insumo antes de registrar movimientos');
    expect((await api('get', '/api/ingredients?pageSize=1')).body.summary.total).toBe(11);
    expect((await api('get', '/api/ingredients/999')).status).toBe(404);
    expect((await api('get', '/api/ingredients/999/movements')).status).toBe(404);
  });
});
