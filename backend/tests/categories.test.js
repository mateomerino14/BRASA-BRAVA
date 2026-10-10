import {existsSync} from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';

// PNG mínimo válido (firma de 8 bytes + relleno)
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);

const newCategory = {
  nombre: 'Postres',
  descripcion: 'Dulces de la casa',
  subcategorias: [{nombre: 'Helados'}, {nombre: 'Tortas'}],
};

describe('Gestión de categorías', () => {
  let ctx;
  let admin;

  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await loginAs(ctx.app, 'admin');
  });
  afterEach(() => ctx.db.close());

  // Ejecuta una petición autenticada como administrador
  const api = (method, url) => request(ctx.app)[method](url).set('authorization', admin.authorization);

  // Busca el id de una categoría demo por su nombre
  const categoryId = async (name) => {
    const {rows} = await ctx.db.query('SELECT id_categoria FROM categoria WHERE nombre = $1', [name]);
    return rows[0].id_categoria;
  };

  it('exige sesión y el permiso de categorías', async () => {
    expect((await request(ctx.app).get('/api/categories')).status).toBe(401);
    const cajero = await loginAs(ctx.app, 'a.romero');
    const res = await request(ctx.app).get('/api/categories').set('authorization', cajero.authorization);
    expect(res.status).toBe(403);
  });

  it('lista paginado con subcategorías activas', async () => {
    const res = await api('get', '/api/categories?pageSize=2');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({total: 4, page: 1, pageSize: 2});
    expect(res.body.items).toHaveLength(2);
    const burgers = (await api('get', '/api/categories')).body.items.find((item) => item.nombre === 'Hamburguesas');
    expect(burgers.subcategorias.map((sub) => sub.nombre)).toEqual(['Clásicas', 'Especiales', 'Doble Carne']);
    // Cuenta solo productos activos: la Hamburguesa Hawaiana está de baja
    expect(burgers).toMatchObject({activa: true, imagenUrl: null, totalProductos: 4});
  });

  it('filtra por estado y busca también en subcategorías', async () => {
    const inactive = await api('get', '/api/categories?estado=inactivos');
    expect(inactive.body.items.map((item) => item.nombre)).toEqual(['Combos Especiales']);
    const bySub = await api('get', '/api/categories?search=cerve');
    expect(bySub.body.items.map((item) => item.nombre)).toEqual(['Bebidas y Refrescos']);
  });

  it('registra una categoría con sus subcategorías', async () => {
    const res = await api('post', '/api/categories').send(newCategory);
    expect(res.status).toBe(201);
    expect(res.body.category).toMatchObject({nombre: 'Postres', descripcion: 'Dulces de la casa', activa: true});
    expect(res.body.category.subcategorias.map((sub) => sub.nombre)).toEqual(['Helados', 'Tortas']);
  });

  it('valida nombre, subcategorías vacías y repetidas', async () => {
    const empty = await api('post', '/api/categories').send({...newCategory, subcategorias: []});
    expect(empty.status).toBe(400);
    expect(empty.body.message).toBe('Agregue al menos una subcategoría');
    const repeated = await api('post', '/api/categories').send({...newCategory, subcategorias: [{nombre: 'Tortas'}, {nombre: 'tortas'}]});
    expect(repeated.body.message).toBe('Hay subcategorías repetidas');
    const short = await api('post', '/api/categories').send({...newCategory, nombre: 'P'});
    expect(short.status).toBe(400);
  });

  it('rechaza nombres de categoría duplicados sin distinguir mayúsculas', async () => {
    const res = await api('post', '/api/categories').send({...newCategory, nombre: 'HAMBURGUESAS'});
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Ya existe una categoría con ese nombre');
  });

  it('sincroniza subcategorías al modificar: renombra, agrega y da de baja', async () => {
    const id = await categoryId('Hamburguesas');
    const current = (await api('get', `/api/categories/${id}`)).body.category;
    const [clasicas, especiales] = current.subcategorias;
    const res = await api('put', `/api/categories/${id}`).send({
      nombre: 'Hamburguesas',
      descripcion: '',
      subcategorias: [{id: clasicas.id, nombre: 'Clásicas de la Casa'}, {id: especiales.id, nombre: 'Especiales'}, {nombre: 'Veggie'}],
    });
    expect(res.status).toBe(200);
    expect(res.body.category.descripcion).toBeNull();
    expect(res.body.category.subcategorias.map((sub) => sub.nombre)).toEqual(['Clásicas de la Casa', 'Especiales', 'Veggie']);
    expect(res.body.category.subcategorias[0].id).toBe(clasicas.id);
    const {rows} = await ctx.db.query("SELECT activa FROM subcategoria WHERE nombre = 'Doble Carne'");
    expect(rows[0].activa).toBe(false);
  });

  it('permite conservar el propio nombre y responde 404 si no existe', async () => {
    const id = await categoryId('Bebidas y Refrescos');
    const same = await api('put', `/api/categories/${id}`).send({nombre: 'Bebidas y Refrescos', subcategorias: [{nombre: 'Gaseosas'}]});
    expect(same.status).toBe(200);
    expect((await api('get', '/api/categories/999')).status).toBe(404);
    expect((await api('put', '/api/categories/999').send(newCategory)).status).toBe(404);
  });

  it('da de baja y reactiva una categoría', async () => {
    const id = await categoryId('Hamburguesas');
    const off = await api('patch', `/api/categories/${id}/status`).send({activo: false});
    expect(off.body.category.activa).toBe(false);
    const on = await api('patch', `/api/categories/${id}/status`).send({activo: true});
    expect(on.body.category.activa).toBe(true);
  });

  it('sube, reemplaza, sirve y quita la imagen', async () => {
    const id = await categoryId('Hamburguesas');
    const first = await api('put', `/api/categories/${id}/image`).attach('imagen', PNG, 'foto.png');
    expect(first.status).toBe(200);
    const firstUrl = first.body.category.imagenUrl;
    expect(firstUrl).toMatch(/^\/uploads\/[\w-]+\.png$/);
    const served = await request(ctx.app).get(firstUrl);
    expect(served.status).toBe(200);
    expect(served.headers['content-type']).toBe('image/png');

    const second = await api('put', `/api/categories/${id}/image`).attach('imagen', PNG, 'otra.png');
    const firstFile = path.join(ctx.config.UPLOADS_DIR, path.basename(firstUrl));
    expect(existsSync(firstFile)).toBe(false);

    const removed = await api('delete', `/api/categories/${id}/image`);
    expect(removed.body.category.imagenUrl).toBeNull();
    expect(existsSync(path.join(ctx.config.UPLOADS_DIR, path.basename(second.body.category.imagenUrl)))).toBe(false);
  });

  it('rechaza archivos que no son imagen o sin adjunto', async () => {
    const id = await categoryId('Hamburguesas');
    const fake = await api('put', `/api/categories/${id}/image`).attach('imagen', Buffer.from('<script>'), 'foto.png');
    expect(fake.status).toBe(400);
    expect(fake.body.message).toBe('La imagen debe ser PNG, JPG o WEBP');
    const missing = await api('put', `/api/categories/${id}/image`);
    expect(missing.status).toBe(400);
    expect(missing.body.message).toBe('Adjunte una imagen');
    expect((await request(ctx.app).get('/uploads/no-existe.png')).status).toBe(404);
  });

  it('ordena por columnas permitidas y rechaza las demás', async () => {
    const asc = await api('get', '/api/categories?sort=nombre&dir=asc');
    expect(asc.body.items.map((item) => item.nombre)).toEqual(['Bebidas y Refrescos', 'Combos Especiales', 'Guarniciones y Extras', 'Hamburguesas']);
    const desc = await api('get', '/api/categories?sort=nombre&dir=desc&pageSize=1');
    expect(desc.body.items[0].nombre).toBe('Hamburguesas');
    const byStatus = await api('get', '/api/categories?sort=estado&dir=asc');
    expect(byStatus.body.items[0].nombre).toBe('Combos Especiales');
    expect((await api('get', '/api/categories?sort=imagen_url;DROP TABLE categoria')).status).toBe(400);
    expect((await api('get', '/api/categories?dir=arriba')).status).toBe(400);
  });
});
