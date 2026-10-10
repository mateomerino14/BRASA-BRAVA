import {existsSync} from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);

describe('Gestión de productos', () => {
  let ctx;
  let admin;

  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await loginAs(ctx.app, 'admin');
  });
  afterEach(() => ctx.db.close());

  // Ejecuta una petición autenticada como administrador
  const api = (method, url) => request(ctx.app)[method](url).set('authorization', admin.authorization);

  // Busca un id por nombre en la tabla indicada
  const idOf = async (table, name) => {
    const {rows} = await ctx.db.query(`SELECT id_${table} AS id FROM ${table} WHERE nombre = $1`, [name]);
    return rows[0].id;
  };

  const newProduct = async (overrides = {}) => ({
    nombre: 'Hamburguesa Picante',
    descripcion: 'Jalapeños y salsa chipotle',
    precio: '42,50',
    idSubcategoria: await idOf('subcategoria', 'Especiales'),
    ...overrides,
  });

  it('exige sesión y el permiso de productos', async () => {
    expect((await request(ctx.app).get('/api/products')).status).toBe(401);
    const cajero = await loginAs(ctx.app, 'a.romero');
    expect((await request(ctx.app).get('/api/products').set('authorization', cajero.authorization)).status).toBe(403);
  });

  it('lista con categoría, subcategoría, precio numérico y paginación', async () => {
    const res = await api('get', '/api/products?pageSize=5');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({total: 12, page: 1, pageSize: 5});
    const clasica = (await api('get', '/api/products?search=hamburguesa clásica')).body.items[0];
    expect(clasica).toMatchObject({
      nombre: 'Hamburguesa Clásica',
      precio: 35,
      activo: true,
      disponible: true,
      imagenUrl: null,
      categoria: {nombre: 'Hamburguesas', activa: true},
      subcategoria: {nombre: 'Clásicas', activa: true},
    });
  });

  it('filtra por categoría, subcategoría, estado y disponibilidad', async () => {
    const burgers = await api('get', `/api/products?idCategoria=${await idOf('categoria', 'Hamburguesas')}&pageSize=20`);
    expect(burgers.body.total).toBe(5);
    const especiales = await api('get', `/api/products?idSubcategoria=${await idOf('subcategoria', 'Especiales')}&estado=activos`);
    expect(especiales.body.items.map((item) => item.nombre)).toEqual(['Brava BBQ']);
    const agotados = await api('get', '/api/products?disponibilidad=agotados');
    expect(agotados.body.items.map((item) => item.nombre)).toEqual(['Cerveza Artesanal']);
    const busqueda = await api('get', '/api/products?search=tocino');
    expect(busqueda.body.items.map((item) => item.nombre)).toEqual(['Brava BBQ']);
  });

  it('ordena por precio y por categoría', async () => {
    const cheap = await api('get', '/api/products?sort=precio&dir=asc&pageSize=1');
    expect(cheap.body.items[0].nombre).toBe('Salsa de la Casa');
    const expensive = await api('get', '/api/products?sort=precio&dir=desc&pageSize=1');
    expect(expensive.body.items[0].nombre).toBe('Dúo Parrillero');
    const byCategory = await api('get', '/api/products?sort=categoria&pageSize=1');
    expect(byCategory.body.items[0].categoria.nombre).toBe('Bebidas y Refrescos');
    expect((await api('get', '/api/products?sort=costo')).status).toBe(400);
  });

  it('devuelve solo categorías y subcategorías activas como opciones', async () => {
    const res = await api('get', '/api/products/options');
    expect(res.status).toBe(200);
    const names = res.body.categorias.map((category) => category.nombre);
    expect(names).toEqual(['Bebidas y Refrescos', 'Guarniciones y Extras', 'Hamburguesas']);
    const burgers = res.body.categorias.find((category) => category.nombre === 'Hamburguesas');
    expect(burgers.subcategorias.map((sub) => sub.nombre)).toEqual(['Clásicas', 'Especiales', 'Doble Carne']);
  });

  it('registra un producto aceptando precio con coma decimal', async () => {
    const res = await api('post', '/api/products').send(await newProduct());
    expect(res.status).toBe(201);
    expect(res.body.product).toMatchObject({nombre: 'Hamburguesa Picante', precio: 42.5, activo: true, disponible: true, subcategoria: {nombre: 'Especiales'}});
  });

  it('valida nombre, precio y subcategoría', async () => {
    const noPrice = await api('post', '/api/products').send(await newProduct({precio: '0'}));
    expect(noPrice.status).toBe(400);
    expect(noPrice.body.message).toBe('El precio debe ser mayor a 0');
    const decimals = await api('post', '/api/products').send(await newProduct({precio: 10.555}));
    expect(decimals.body.message).toBe('El precio admite hasta 2 decimales');
    const text = await api('post', '/api/products').send(await newProduct({precio: 'diez'}));
    expect(text.status).toBe(400);
    const noSub = await api('post', '/api/products').send(await newProduct({idSubcategoria: undefined}));
    expect(noSub.body.message).toBe('Seleccione una subcategoría');
  });

  it('no permite nombres repetidos ni subcategorías dadas de baja', async () => {
    const duplicate = await api('post', '/api/products').send(await newProduct({nombre: 'HAMBURGUESA CLÁSICA'}));
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toBe('Ya existe un producto con ese nombre');
    const inactiveCategory = await api('post', '/api/products').send(await newProduct({idSubcategoria: await idOf('subcategoria', 'Familiar Brava')}));
    expect(inactiveCategory.status).toBe(400);
    expect(inactiveCategory.body.message).toBe('Seleccione una subcategoría activa');
    await ctx.db.query("UPDATE subcategoria SET activa = FALSE WHERE nombre = 'Especiales'");
    expect((await api('post', '/api/products').send(await newProduct())).status).toBe(400);
  });

  it('modifica un producto y conserva su subcategoría aunque se haya dado de baja', async () => {
    const id = await idOf('producto', 'Dúo Parrillero');
    const current = (await api('get', `/api/products/${id}`)).body.product;
    expect(current.categoria.activa).toBe(false);
    const res = await api('put', `/api/products/${id}`).send({nombre: 'Dúo Parrillero', descripcion: '', precio: 90, idSubcategoria: current.subcategoria.id});
    expect(res.status).toBe(200);
    expect(res.body.product).toMatchObject({precio: 90, descripcion: null});
    expect((await api('put', '/api/products/999').send(await newProduct())).status).toBe(404);
  });

  it('da de baja, reactiva y marca como agotado', async () => {
    const id = await idOf('producto', 'Brava BBQ');
    const off = await api('patch', `/api/products/${id}/status`).send({activo: false});
    expect(off.body.product.activo).toBe(false);
    const sold = await api('patch', `/api/products/${id}/availability`).send({disponible: false});
    expect(sold.body.product.disponible).toBe(false);
    expect((await api('patch', `/api/products/${id}/availability`).send({disponible: 'no'})).status).toBe(400);
    const categories = await api('get', '/api/categories?search=Hamburguesas');
    expect(categories.body.items[0].totalProductos).toBe(3);
  });

  it('sube, reemplaza y quita la foto del producto', async () => {
    const id = await idOf('producto', 'Doble Brava');
    const first = await api('put', `/api/products/${id}/image`).attach('imagen', PNG, 'doble.png');
    expect(first.status).toBe(200);
    const firstFile = path.join(ctx.config.UPLOADS_DIR, path.basename(first.body.product.imagenUrl));
    expect(existsSync(firstFile)).toBe(true);
    await api('put', `/api/products/${id}/image`).attach('imagen', PNG, 'otra.png');
    expect(existsSync(firstFile)).toBe(false);
    const removed = await api('delete', `/api/products/${id}/image`);
    expect(removed.body.product.imagenUrl).toBeNull();
    const fake = await api('put', `/api/products/${id}/image`).attach('imagen', Buffer.from('hola'), 'x.png');
    expect(fake.status).toBe(400);
  });
});
