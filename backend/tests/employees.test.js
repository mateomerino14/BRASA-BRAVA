import {existsSync} from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';

// PNG mínimo válido (firma de 8 bytes + relleno)
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);

const newEmployee = {
  nombre: 'Lucía',
  apellido: 'Flores',
  ci: '7123456 cb',
  alias: 'L.Flores',
  correo: 'L.Flores@BrasaBrava.bo',
  telefono: '71112233',
  idCargo: 2,
  contrasena: 'Inicial2026',
};

describe('Gestión de empleados', () => {
  let ctx;
  let admin;

  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await loginAs(ctx.app, 'admin');
  });
  afterEach(() => ctx.db.close());

  // Ejecuta una petición autenticada como administrador
  const api = (method, url) => request(ctx.app)[method](url).set('authorization', admin.authorization);

  // Obtiene el id de un cargo por su nombre
  const roleId = async (name) => {
    const {rows} = await ctx.db.query('SELECT id_cargo FROM cargo WHERE nombre = $1', [name]);
    return rows[0].id_cargo;
  };

  it('exige sesión y el permiso de empleados', async () => {
    expect((await request(ctx.app).get('/api/employees')).status).toBe(401);
    const cajero = await loginAs(ctx.app, 'a.romero');
    const res = await request(ctx.app).get('/api/employees').set('authorization', cajero.authorization);
    expect(res.status).toBe(403);
  });

  it('lista con paginación, empleados activos primero', async () => {
    const res = await api('get', '/api/employees?pageSize=3');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5);
    expect(res.body.items).toHaveLength(3);
    expect(res.body.items[0]).toMatchObject({activo: true, cargo: {nombre: expect.any(String)}});
    expect(res.body.items[0]).not.toHaveProperty('contrasena_hash');
    const last = await api('get', '/api/employees?pageSize=3&page=2');
    expect(last.body.items.at(-1)).toMatchObject({alias: 'j.ortiz', activo: false});
  });

  it('busca por nombre, usuario o CI y filtra por cargo y estado', async () => {
    const byName = await api('get', '/api/employees?search=romero');
    expect(byName.body.items.map((e) => e.alias)).toEqual(['a.romero']);
    const byCi = await api('get', '/api/employees?search=3209110');
    expect(byCi.body.items.map((e) => e.alias)).toEqual(['r.sanchez']);
    const meseros = await api('get', `/api/employees?idCargo=${await roleId('Mesero')}`);
    expect(meseros.body.total).toBe(2);
    const inactivos = await api('get', '/api/employees?estado=inactivos');
    expect(inactivos.body.items.map((e) => e.alias)).toEqual(['j.ortiz']);
  });

  it('registra un empleado normalizando sus datos y le permite iniciar sesión', async () => {
    const res = await api('post', '/api/employees').send({...newEmployee, idCargo: await roleId('Cajero')});
    expect(res.status).toBe(201);
    expect(res.body.employee).toMatchObject({
      alias: 'l.flores',
      correo: 'l.flores@brasabrava.bo',
      ci: '7123456 CB',
      activo: true,
      cargo: {nombre: 'Cajero'},
    });
    const login = await request(ctx.app).post('/api/auth/login').send({username: 'l.flores', password: 'Inicial2026'});
    expect(login.status).toBe(200);
    expect(login.body.user.permissions).toEqual(['home', 'familia', 'caja']);
  });

  it('rechaza CI, usuario o correo repetidos', async () => {
    const idCargo = await roleId('Cajero');
    const ci = await api('post', '/api/employees').send({...newEmployee, idCargo, ci: '6812903 LP'});
    expect(ci.status).toBe(409);
    expect(ci.body.message).toBe('Ya existe un empleado con ese CI');
    const alias = await api('post', '/api/employees').send({...newEmployee, idCargo, alias: 'A.Romero'});
    expect(alias.body.message).toBe('Ese nombre de usuario ya está en uso');
    const correo = await api('post', '/api/employees').send({...newEmployee, idCargo, correo: 'a.romero@brasabrava.bo'});
    expect(correo.body.message).toBe('Ese correo ya está registrado');
  });

  it('valida los campos y el cargo', async () => {
    const sinNombre = await api('post', '/api/employees').send({...newEmployee, nombre: ''});
    expect(sinNombre.status).toBe(400);
    expect(sinNombre.body.message).toBe('Ingrese el nombre');
    const telefono = await api('post', '/api/employees').send({...newEmployee, telefono: '12'});
    expect(telefono.body.message).toMatch(/teléfono/);
    const clave = await api('post', '/api/employees').send({...newEmployee, contrasena: 'corta'});
    expect(clave.body.message).toMatch(/8 caracteres/);
    const cargo = await api('post', '/api/employees').send({...newEmployee, idCargo: 999});
    expect(cargo.body.message).toBe('Seleccione un cargo válido');
  });

  it('modifica datos sin tocar la contraseña si no se envía', async () => {
    const list = await api('get', '/api/employees?search=mendoza');
    const target = list.body.items[0];
    const res = await api('put', `/api/employees/${target.id}`).send({
      nombre: 'Carlos Andrés',
      apellido: target.apellido,
      ci: target.ci,
      alias: target.alias,
      correo: target.correo,
      telefono: '',
      idCargo: await roleId('Cajero'),
      contrasena: '',
    });
    expect(res.status).toBe(200);
    expect(res.body.employee).toMatchObject({nombre: 'Carlos Andrés', telefono: null, cargo: {nombre: 'Cajero'}});
    const login = await request(ctx.app).post('/api/auth/login').send({username: 'c.mendoza', password: 'Brasa2026'});
    expect(login.status).toBe(200);
  });

  it('cambia la contraseña al modificar si se envía una nueva', async () => {
    const {body} = await api('get', '/api/employees?search=sanchez');
    const target = body.items[0];
    await api('put', `/api/employees/${target.id}`).send({...target, idCargo: target.cargo.id, telefono: target.telefono, contrasena: 'NuevaClave1'});
    const old = await request(ctx.app).post('/api/auth/login').send({username: 'r.sanchez', password: 'Brasa2026'});
    expect(old.status).toBe(401);
    const nueva = await request(ctx.app).post('/api/auth/login').send({username: 'r.sanchez', password: 'NuevaClave1'});
    expect(nueva.status).toBe(200);
  });

  it('da de baja y reactiva; el dado de baja no puede ingresar', async () => {
    const {body} = await api('get', '/api/employees?search=romero');
    const id = body.items[0].id;
    const baja = await api('patch', `/api/employees/${id}/status`).send({activo: false});
    expect(baja.body.employee.activo).toBe(false);
    const login = await request(ctx.app).post('/api/auth/login').send({username: 'a.romero', password: 'Brasa2026'});
    expect(login.status).toBe(401);
    const alta = await api('patch', `/api/employees/${id}/status`).send({activo: true});
    expect(alta.body.employee.activo).toBe(true);
  });

  it('impide darse de baja a sí mismo, salvo el DIRECTORIO', async () => {
    const res = await api('patch', `/api/employees/${admin.user.id}/status`).send({activo: false});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No puede dar de baja su propia cuenta');
    const directorio = await loginAs(ctx.app, 'DIRECTORIO');
    const ok = await request(ctx.app)
      .patch(`/api/employees/${admin.user.id}/status`)
      .set('authorization', directorio.authorization)
      .send({activo: false});
    expect(ok.status).toBe(200);
  });

  it('responde 404 con un empleado inexistente', async () => {
    expect((await api('get', '/api/employees/9999')).status).toBe(404);
    expect((await api('patch', '/api/employees/9999/status').send({activo: true})).status).toBe(404);
    expect((await api('get', '/api/employees/abc')).status).toBe(400);
  });

  it('lista los cargos activos para el formulario', async () => {
    const res = await api('get', '/api/roles');
    expect(res.status).toBe(200);
    expect(res.body.roles.map((role) => role.nombre)).toEqual(['Administrador', 'Cajero', 'Cocinero', 'Mesero']);
  });

  it('ordena por nombre, cargo o usuario y rechaza columnas no permitidas', async () => {
    const byName = await api('get', '/api/employees?sort=nombre&dir=desc&pageSize=10');
    const names = byName.body.items.map((employee) => employee.nombre);
    expect(names).toEqual(['Roberto', 'Marco', 'Javier', 'Carlos', 'Andrea']);
    const byRole = await api('get', '/api/employees?sort=cargo&dir=asc&pageSize=10');
    expect(byRole.body.items[0].cargo.nombre).toBe('Administrador');
    // Descendente para no depender de cómo la base ordena los puntos de "a.romero" frente a "admin"
    const byUser = await api('get', '/api/employees?sort=usuario&dir=desc&pageSize=1');
    expect(byUser.body.items[0].alias).toBe('r.sanchez');
    expect((await api('get', '/api/employees?sort=contrasena_hash')).status).toBe(400);
  });

  it('sube, reemplaza y quita la foto del empleado, y la muestra en el login', async () => {
    const id = (await ctx.db.query("SELECT id_empleado FROM empleado WHERE alias = 'c.mendoza'")).rows[0].id_empleado;
    const first = await api('put', `/api/employees/${id}/image`).attach('imagen', PNG, 'foto.png');
    expect(first.status).toBe(200);
    const firstUrl = first.body.employee.fotoUrl;
    expect(firstUrl).toMatch(/^\/uploads\/.+\.png$/);
    expect((await request(ctx.app).get(firstUrl)).headers['content-type']).toBe('image/png');
    const carousel = await request(ctx.app).get('/api/auth/login-users');
    expect(carousel.body.users.find((item) => item.alias === 'c.mendoza').fotoUrl).toBe(firstUrl);
    const session = await loginAs(ctx.app, 'c.mendoza');
    expect(session.user.fotoUrl).toBe(firstUrl);

    const second = await api('put', `/api/employees/${id}/image`).attach('imagen', PNG, 'otra.png');
    expect(existsSync(path.join(ctx.config.UPLOADS_DIR, path.basename(firstUrl)))).toBe(false);
    const removed = await api('delete', `/api/employees/${id}/image`);
    expect(removed.body.employee.fotoUrl).toBeNull();
    expect(existsSync(path.join(ctx.config.UPLOADS_DIR, path.basename(second.body.employee.fotoUrl)))).toBe(false);

    const fake = await api('put', `/api/employees/${id}/image`).attach('imagen', Buffer.from('<script>'), 'foto.png');
    expect(fake.status).toBe(400);
    expect((await api('put', '/api/employees/9999/image').attach('imagen', PNG, 'foto.png')).status).toBe(404);
    const cajero = await loginAs(ctx.app, 'a.romero');
    expect((await request(ctx.app).put(`/api/employees/${id}/image`).set('authorization', cajero.authorization).attach('imagen', PNG, 'foto.png')).status).toBe(403);
  });
});
