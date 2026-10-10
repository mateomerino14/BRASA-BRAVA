import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';

const newSection = {
  nombre: 'Patio',
  descripcion: 'Con fogón',
  mesas: [{nombre: 'P1', capacidad: 4}, {nombre: 'P2', capacidad: '6'}],
};

describe('Gestión de secciones y mesas', () => {
  let ctx;
  let admin;

  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await loginAs(ctx.app, 'admin');
  });
  afterEach(() => ctx.db.close());

  const api = (method, url) => request(ctx.app)[method](url).set('authorization', admin.authorization);

  const sectionId = async (name) => {
    const {rows} = await ctx.db.query('SELECT id_seccion FROM seccion WHERE nombre = $1', [name]);
    return rows[0].id_seccion;
  };

  it('exige sesión y el permiso de secciones', async () => {
    expect((await request(ctx.app).get('/api/sections')).status).toBe(401);
    const cajero = await loginAs(ctx.app, 'a.romero');
    expect((await request(ctx.app).get('/api/sections').set('authorization', cajero.authorization)).status).toBe(403);
  });

  it('lista secciones con sus mesas, totales y resumen del local', async () => {
    const res = await api('get', '/api/sections');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(4);
    // Solo secciones activas: 10 + 4 + 3 mesas; 8×4 + 2×6 + 4×4 + 3×2 personas
    expect(res.body.summary).toEqual({secciones: 3, mesas: 17, capacidad: 66});
    const salon = res.body.items.find((item) => item.nombre === 'Salón principal');
    expect(salon).toMatchObject({activa: true, totalMesas: 10, capacidad: 44});
    expect(salon.mesas[0]).toEqual({id: expect.any(Number), nombre: 'Mesa 1', capacidad: 4});
  });

  it('busca también por nombre de mesa, filtra y ordena por capacidad', async () => {
    const bar = await api('get', '/api/sections?search=barra 2');
    expect(bar.body.items.map((item) => item.nombre)).toEqual(['Barra']);
    const inactive = await api('get', '/api/sections?estado=inactivos');
    expect(inactive.body.items.map((item) => item.nombre)).toEqual(['Salón VIP']);
    const biggest = await api('get', '/api/sections?sort=capacidad&dir=desc&pageSize=1');
    expect(biggest.body.items[0].nombre).toBe('Salón principal');
    const fewest = await api('get', '/api/sections?sort=mesas&pageSize=1');
    expect(fewest.body.items[0].nombre).toBe('Salón VIP');
  });

  it('registra una sección con sus mesas', async () => {
    const res = await api('post', '/api/sections').send(newSection);
    expect(res.status).toBe(201);
    expect(res.body.section).toMatchObject({nombre: 'Patio', descripcion: 'Con fogón', totalMesas: 2, capacidad: 10});
    expect(res.body.section.mesas.map((item) => [item.nombre, item.capacidad])).toEqual([['P1', 4], ['P2', 6]]);
  });

  it('valida nombre, mesas, capacidad y repetidos', async () => {
    const empty = await api('post', '/api/sections').send({...newSection, mesas: []});
    expect(empty.body.message).toBe('Agregue al menos una mesa');
    const repeated = await api('post', '/api/sections').send({...newSection, mesas: [{nombre: 'P1', capacidad: 2}, {nombre: 'p1', capacidad: 2}]});
    expect(repeated.body.message).toBe('Hay mesas con el mismo nombre');
    const big = await api('post', '/api/sections').send({...newSection, mesas: [{nombre: 'P1', capacidad: 40}]});
    expect(big.body.message).toBe('La capacidad debe ser de 1 a 30 personas');
    const half = await api('post', '/api/sections').send({...newSection, mesas: [{nombre: 'P1', capacidad: 2.5}]});
    expect(half.body.message).toBe('La capacidad es un número entero de personas');
    const duplicate = await api('post', '/api/sections').send({...newSection, nombre: 'TERRAZA'});
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toBe('Ya existe una sección con ese nombre');
  });

  it('sincroniza mesas al modificar: cambia, agrega y da de baja', async () => {
    const id = await sectionId('Terraza');
    const current = (await api('get', `/api/sections/${id}`)).body.section;
    const [t1, t2] = current.mesas;
    const res = await api('put', `/api/sections/${id}`).send({
      nombre: 'Terraza',
      descripcion: '',
      mesas: [{id: t1.id, nombre: 'Terraza 1', capacidad: 6}, {id: t2.id, nombre: 'Terraza Sol', capacidad: 2}, {nombre: 'Terraza 5', capacidad: 4}],
    });
    expect(res.status).toBe(200);
    expect(res.body.section).toMatchObject({descripcion: null, totalMesas: 3, capacidad: 12});
    expect(res.body.section.mesas.map((item) => [item.id === t1.id, item.nombre, item.capacidad])).toEqual([[true, 'Terraza 1', 6], [false, 'Terraza Sol', 2], [false, 'Terraza 5', 4]]);
    const {rows} = await ctx.db.query('SELECT COUNT(*)::int AS total FROM mesa WHERE id_seccion = $1 AND activa = FALSE', [id]);
    expect(rows[0].total).toBe(2);
  });

  it('da de baja y reactiva una sección; responde 404 si no existe', async () => {
    const id = await sectionId('Barra');
    const off = await api('patch', `/api/sections/${id}/status`).send({activo: false});
    expect(off.body.section.activa).toBe(false);
    expect((await api('get', '/api/sections')).body.summary.secciones).toBe(2);
    const on = await api('patch', `/api/sections/${id}/status`).send({activo: true});
    expect(on.body.section.activa).toBe(true);
    expect((await api('get', '/api/sections/999')).status).toBe(404);
    expect((await api('put', '/api/sections/999').send(newSection)).status).toBe(404);
  });
});
