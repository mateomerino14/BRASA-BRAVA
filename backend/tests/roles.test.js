import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';

describe('Gestión de cargos y permisos', () => {
  let ctx;
  let admin;

  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await loginAs(ctx.app, 'admin');
  });
  afterEach(() => ctx.db.close());

  const api = (method, url) => request(ctx.app)[method](url).set('authorization', admin.authorization);

  const roleId = async (name) => {
    const {rows} = await ctx.db.query('SELECT id_cargo FROM cargo WHERE nombre = $1', [name]);
    return rows[0].id_cargo;
  };

  it('exige sesión y el permiso de cargos', async () => {
    expect((await request(ctx.app).get('/api/roles')).status).toBe(401);
    const cajero = await loginAs(ctx.app, 'a.romero');
    expect((await request(ctx.app).get('/api/roles').set('authorization', cajero.authorization)).status).toBe(403);
    expect(admin.user.permissions).toContain('cargos');
  });

  it('lista cargos con sus pantallas, empleados activos y resumen', async () => {
    const res = await api('get', '/api/roles?pageSize=10');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(4);
    expect(res.body.summary).toEqual({cargos: 4, inactivos: 0, empleados: 4});
    const mesero = res.body.items.find((item) => item.nombre === 'Mesero');
    expect(mesero).toMatchObject({activo: true, totalEmpleados: 1, pantallas: ['familia', 'caja']});
    const byScreens = await api('get', '/api/roles?sort=pantallas&dir=desc&pageSize=1');
    expect(byScreens.body.items[0].nombre).toBe('Administrador');
    const search = await api('get', '/api/roles?search=coci');
    expect(search.body.items.map((item) => item.nombre)).toEqual(['Cocinero']);
  });

  it('registra un cargo y sus pantallas sirven al iniciar sesión', async () => {
    const res = await api('post', '/api/roles').send({nombre: 'Bartender', pantallas: ['caja', 'familia', 'caja']});
    expect(res.status).toBe(201);
    expect(res.body.role).toMatchObject({nombre: 'Bartender', totalEmpleados: 0, pantallas: ['familia', 'caja']});
    await ctx.db.query('UPDATE empleado SET id_cargo = $1 WHERE alias = $2', [res.body.role.id, 'c.mendoza']);
    const bartender = await loginAs(ctx.app, 'c.mendoza');
    expect(bartender.user).toMatchObject({cargo: 'Bartender', permissions: ['home', 'familia', 'caja']});
  });

  it('valida nombre, pantallas y nombres repetidos', async () => {
    const empty = await api('post', '/api/roles').send({nombre: 'Bar', pantallas: []});
    expect(empty.status).toBe(400);
    expect(empty.body.message).toBe('Marque al menos una pantalla');
    const unknown = await api('post', '/api/roles').send({nombre: 'Bar', pantallas: ['home']});
    expect(unknown.status).toBe(400);
    const duplicate = await api('post', '/api/roles').send({nombre: 'mesero', pantallas: ['caja']});
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toBe('Ya existe un cargo con ese nombre');
  });

  it('renombra un cargo y reemplaza sus pantallas', async () => {
    const id = await roleId('Cocinero');
    const res = await api('put', `/api/roles/${id}`).send({nombre: 'Parrillero', pantallas: ['caja', 'stock']});
    expect(res.status).toBe(200);
    expect(res.body.role).toMatchObject({nombre: 'Parrillero', pantallas: ['caja', 'stock']});
    const cocinero = await loginAs(ctx.app, 'r.sanchez');
    expect(cocinero.user).toMatchObject({cargo: 'Parrillero', permissions: ['home', 'caja', 'stock']});
  });

  it('no da de baja un cargo con empleados activos, sí uno sin ellos', async () => {
    const mesero = await roleId('Mesero');
    const blocked = await api('patch', `/api/roles/${mesero}/status`).send({activo: false});
    expect(blocked.status).toBe(409);
    expect(blocked.body.message).toBe('No se puede dar de baja: 1 empleado activo tiene este cargo. Cámbieles el cargo primero');
    const created = await api('post', '/api/roles').send({nombre: 'Delivery', pantallas: ['caja']});
    const off = await api('patch', `/api/roles/${created.body.role.id}/status`).send({activo: false});
    expect(off.body.role.activo).toBe(false);
    expect((await api('get', '/api/roles')).body.summary).toEqual({cargos: 4, inactivos: 1, empleados: 4});
    const options = await api('get', '/api/roles/options');
    expect(options.body.roles.map((role) => role.nombre)).not.toContain('Delivery');
  });

  it('responde 404 con un cargo inexistente', async () => {
    expect((await api('get', '/api/roles/9999')).status).toBe(404);
    expect((await api('put', '/api/roles/9999').send({nombre: 'Otro', pantallas: ['caja']})).status).toBe(404);
    expect((await api('patch', '/api/roles/9999/status').send({activo: true})).status).toBe(404);
  });
});

describe('Contraseña del DIRECTORIO', () => {
  let ctx;

  beforeEach(async () => {
    ctx = await createTestApp();
  });
  afterEach(() => ctx.db.close());

  const change = (session, body) => request(ctx.app).put('/api/auth/directorio/password').set('authorization', session.authorization).send(body);

  it('cambia la contraseña comprobando la actual', async () => {
    const directorio = await loginAs(ctx.app, 'DIRECTORIO');
    const wrong = await change(directorio, {actual: 'Otra2026', nueva: 'Nueva2027', confirmacion: 'Nueva2027'});
    expect(wrong.status).toBe(400);
    expect(wrong.body).toMatchObject({message: 'La contraseña actual no es correcta', campo: 'actual'});
    const ok = await change(directorio, {actual: 'Directorio2026', nueva: 'Nueva2027', confirmacion: 'Nueva2027'});
    expect(ok.status).toBe(200);
    const old = await request(ctx.app).post('/api/auth/login').send({username: 'DIRECTORIO', password: 'Directorio2026'});
    expect(old.status).toBe(401);
    const fresh = await request(ctx.app).post('/api/auth/login').send({username: 'DIRECTORIO', password: 'Nueva2027'});
    expect(fresh.status).toBe(200);
  });

  it('valida la confirmación y que la nueva sea distinta', async () => {
    const directorio = await loginAs(ctx.app, 'DIRECTORIO');
    const mismatch = await change(directorio, {actual: 'Directorio2026', nueva: 'Nueva2027', confirmacion: 'Nueva2028'});
    expect(mismatch.body.message).toBe('Las contraseñas no coinciden');
    const same = await change(directorio, {actual: 'Directorio2026', nueva: 'Directorio2026', confirmacion: 'Directorio2026'});
    expect(same.body.message).toBe('La nueva contraseña debe ser distinta de la actual');
    const weak = await change(directorio, {actual: 'Directorio2026', nueva: 'corta', confirmacion: 'corta'});
    expect(weak.status).toBe(400);
  });

  it('solo el DIRECTORIO puede usarlo', async () => {
    const admin = await loginAs(ctx.app, 'admin');
    const res = await change(admin, {actual: 'Brasa2026', nueva: 'Nueva2027', confirmacion: 'Nueva2027'});
    expect(res.status).toBe(403);
  });
});
