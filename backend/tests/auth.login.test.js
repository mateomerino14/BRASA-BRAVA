import request from 'supertest';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';

describe('Autenticación: login', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.db.close());

  it('inicia sesión de un empleado con los permisos de su cargo', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({username: 'a.romero', password: 'Brasa2026'});
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      alias: 'a.romero',
      nombre: 'Andrea Romero',
      cargo: 'Cajero',
      isDirectorio: false,
      permissions: ['home', 'familia', 'caja'],
    });
    expect(res.body.user).not.toHaveProperty('contrasena_hash');
  });

  it('el alias no distingue mayúsculas', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({username: 'A.ROMERO', password: 'Brasa2026'});
    expect(res.status).toBe(200);
  });

  it('inicia sesión como DIRECTORIO con todos los permisos', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({username: 'directorio', password: 'Directorio2026'});
    expect(res.status).toBe(200);
    expect(res.body.user.isDirectorio).toBe(true);
    expect(res.body.user.permissions).toContain('empleados');
  });

  it('rechaza contraseña incorrecta con mensaje genérico', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({username: 'a.romero', password: 'mala'});
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Usuario o contraseña incorrectos');
  });

  it('rechaza un usuario inexistente con el mismo mensaje', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({username: 'nadie', password: 'Brasa2026'});
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Usuario o contraseña incorrectos');
  });

  it('no deja entrar a un empleado dado de baja', async () => {
    await ctx.db.query("UPDATE empleado SET activo = FALSE WHERE alias = 'r.sanchez'");
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({username: 'r.sanchez', password: 'Brasa2026'});
    expect(res.status).toBe(401);
  });

  it('valida campos vacíos', async () => {
    const res = await request(ctx.app).post('/api/auth/login').send({username: '', password: ''});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Ingrese su usuario');
  });

  it('responde 400 ante JSON mal formado', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .set('content-type', 'application/json')
      .send('{"username":');
    expect(res.status).toBe(400);
  });

  it('/me devuelve el perfil con un token válido', async () => {
    const login = await request(ctx.app)
      .post('/api/auth/login')
      .send({username: 'admin', password: 'Brasa2026'});
    const res = await request(ctx.app)
      .get('/api/auth/me')
      .set('authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({alias: 'admin', cargo: 'Administrador'});
    expect(res.body.user).not.toHaveProperty('exp');
  });

  it('/me rechaza sin token o con token alterado', async () => {
    expect((await request(ctx.app).get('/api/auth/me')).status).toBe(401);
    const res = await request(ctx.app)
      .get('/api/auth/me')
      .set('authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
  });

  it('lista usuarios del carrusel sin datos sensibles y sin inactivos', async () => {
    const res = await request(ctx.app).get('/api/auth/login-users');
    expect(res.status).toBe(200);
    const aliases = res.body.users.map((user) => user.alias);
    expect(aliases).toContain('c.mendoza');
    expect(aliases).not.toContain('r.sanchez');
    expect(Object.keys(res.body.users[0]).sort()).toEqual(['alias', 'cargo', 'fotoUrl', 'nombre']);
  });

});
