import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';

describe('Recetas de productos', () => {
  let ctx;
  let admin;

  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await loginAs(ctx.app, 'admin');
  });
  afterEach(() => ctx.db.close());

  const api = (method, url) => request(ctx.app)[method](url).set('authorization', admin.authorization);

  const idOf = async (table, name) => {
    const {rows} = await ctx.db.query(`SELECT id_${table} AS id FROM ${table} WHERE nombre = $1`, [name]);
    return rows[0].id;
  };

  const productByName = async (name) => (await api('get', `/api/products?search=${encodeURIComponent(name)}`)).body.items.find((item) => item.nombre === name);

  it('calcula porciones con el insumo más escaso y null sin receta', async () => {
    // Doble Brava: carne 12/0.3 = 40, pan 40/1 = 40, queso 1.5/0.06 = 25 → 25
    expect((await productByName('Doble Brava')).porciones).toBe(25);
    // Hamburguesa Clásica usa lechuga, que está sin stock
    expect((await productByName('Hamburguesa Clásica')).porciones).toBe(0);
    expect((await productByName('Aros de Cebolla')).porciones).toBeNull();
  });

  it('devuelve la receta con el stock de cada insumo', async () => {
    const id = await idOf('producto', 'Papas Fritas Clásicas');
    const res = await api('get', `/api/products/${id}/recipe`);
    expect(res.status).toBe(200);
    expect(res.body.recipe).toEqual({
      porciones: 80,
      ingredientes: [
        {idInsumo: await idOf('insumo', 'Aceite'), nombre: 'Aceite', unidad: 'l', cantidad: 0.05, stockActual: 6, activo: true},
        {idInsumo: await idOf('insumo', 'Papas'), nombre: 'Papas', unidad: 'kg', cantidad: 0.25, stockActual: 20, activo: true},
      ],
    });
  });

  it('lista solo insumos activos como opciones', async () => {
    await ctx.db.query("UPDATE insumo SET activo = FALSE WHERE nombre = 'Aceite'");
    const res = await api('get', '/api/products/recipe-options');
    const names = res.body.insumos.map((item) => item.nombre);
    expect(names).toContain('Carne de res');
    expect(names).not.toContain('Aceite');
  });

  it('guarda, reemplaza y quita la receta', async () => {
    const id = await idOf('producto', 'Aros de Cebolla');
    const cebolla = await idOf('insumo', 'Cebolla');
    const aceite = await idOf('insumo', 'Aceite');
    const saved = await api('put', `/api/products/${id}/recipe`).send({ingredientes: [{idInsumo: cebolla, cantidad: '0,2'}, {idInsumo: aceite, cantidad: 0.1}]});
    expect(saved.status).toBe(200);
    expect(saved.body.recipe.porciones).toBe(20);
    expect(saved.body.recipe.ingredientes.map((item) => [item.nombre, item.cantidad])).toEqual([['Aceite', 0.1], ['Cebolla', 0.2]]);
    const replaced = await api('put', `/api/products/${id}/recipe`).send({ingredientes: [{idInsumo: cebolla, cantidad: 0.5}]});
    expect(replaced.body.recipe).toMatchObject({porciones: 8, ingredientes: [{nombre: 'Cebolla', cantidad: 0.5}]});
    const cleared = await api('put', `/api/products/${id}/recipe`).send({ingredientes: []});
    expect(cleared.body.recipe).toEqual({porciones: null, ingredientes: []});
  });

  it('valida cantidades, repetidos e insumos de baja', async () => {
    const id = await idOf('producto', 'Aros de Cebolla');
    const cebolla = await idOf('insumo', 'Cebolla');
    const zero = await api('put', `/api/products/${id}/recipe`).send({ingredientes: [{idInsumo: cebolla, cantidad: 0}]});
    expect(zero.body.message).toBe('La cantidad debe ser mayor a 0');
    const repeated = await api('put', `/api/products/${id}/recipe`).send({ingredientes: [{idInsumo: cebolla, cantidad: 1}, {idInsumo: cebolla, cantidad: 2}]});
    expect(repeated.body.message).toBe('Hay insumos repetidos en la receta');
    const missing = await api('put', `/api/products/${id}/recipe`).send({ingredientes: [{idInsumo: 999, cantidad: 1}]});
    expect(missing.body.message).toBe('Hay insumos inexistentes o dados de baja en la receta');
    await ctx.db.query("UPDATE insumo SET activo = FALSE WHERE nombre = 'Cebolla'");
    expect((await api('put', `/api/products/${id}/recipe`).send({ingredientes: [{idInsumo: cebolla, cantidad: 1}]})).status).toBe(400);
    expect((await api('get', '/api/products/999/recipe')).status).toBe(404);
  });

  it('conserva un insumo dado de baja que ya estaba en la receta y lo cuenta como sin stock', async () => {
    const id = await idOf('producto', 'Brava BBQ');
    await ctx.db.query("UPDATE insumo SET activo = FALSE WHERE nombre = 'Tocino'");
    const recipe = (await api('get', `/api/products/${id}/recipe`)).body.recipe;
    expect(recipe.porciones).toBe(0);
    expect(recipe.ingredientes.find((item) => item.nombre === 'Tocino').activo).toBe(false);
    const body = {ingredientes: recipe.ingredientes.map(({idInsumo, cantidad}) => ({idInsumo, cantidad}))};
    expect((await api('put', `/api/products/${id}/recipe`).send(body)).status).toBe(200);
  });
});
