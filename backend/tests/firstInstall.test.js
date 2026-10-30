import request from 'supertest';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {ensureDirectorio, INITIAL_DIRECTORIO_PASSWORD} from '../src/db/bootstrap.js';
import {seedDemoData} from '../src/db/seed.js';

const newPassword = 'LocalPropio2026';

// Inicia sesión como DIRECTORIO con la contraseña indicada
const loginDirectorio = (app, password) => request(app).post('/api/auth/login').send({username: 'DIRECTORIO', password});

describe('Instalación nueva sin datos de prueba', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestApp({seed: false});
  });
  afterAll(() => ctx.db.close());

  it('crea solo la cuenta del DIRECTORIO, que debe cambiar la contraseña inicial', async () => {
    const {rows} = await ctx.db.query('SELECT COUNT(*)::int AS total FROM empleado');
    expect(rows[0].total).toBe(0);
    const res = await loginDirectorio(ctx.app, INITIAL_DIRECTORIO_PASSWORD);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({isDirectorio: true, cambiarContrasena: true});
  });

  it('no vuelve a crear la cuenta si ya existe', async () => {
    expect(await ensureDirectorio(ctx.db)).toBe(false);
    const {rows} = await ctx.db.query('SELECT COUNT(*)::int AS total FROM directorio');
    expect(rows[0].total).toBe(1);
  });

  it('bloquea las pantallas hasta cambiar la contraseña, pero deja ver el perfil', async () => {
    const {body} = await loginDirectorio(ctx.app, INITIAL_DIRECTORIO_PASSWORD);
    const auth = {Authorization: `Bearer ${body.token}`};
    const blocked = await request(ctx.app).get('/api/employees').set(auth);
    expect(blocked.status).toBe(403);
    expect(blocked.body.message).toMatch(/contraseña inicial/);
    const deletion = await request(ctx.app).get('/api/deletion/candidates/empleados').set(auth);
    expect(deletion.status).toBe(403);
    const me = await request(ctx.app).get('/api/auth/me').set(auth);
    expect(me.body.user.cambiarContrasena).toBe(true);
  });

  it('al cambiarla entrega una sesión nueva sin el aviso y la contraseña inicial deja de servir', async () => {
    const {body} = await loginDirectorio(ctx.app, INITIAL_DIRECTORIO_PASSWORD);
    const res = await request(ctx.app)
      .put('/api/auth/directorio/password')
      .set({Authorization: `Bearer ${body.token}`})
      .send({actual: INITIAL_DIRECTORIO_PASSWORD, nueva: newPassword, confirmacion: newPassword});
    expect(res.status).toBe(200);
    expect(res.body.user.cambiarContrasena).toBe(false);
    const allowed = await request(ctx.app).get('/api/employees').set({Authorization: `Bearer ${res.body.token}`});
    expect(allowed.status).toBe(200);
    expect((await loginDirectorio(ctx.app, INITIAL_DIRECTORIO_PASSWORD)).status).toBe(401);
    const again = await loginDirectorio(ctx.app, newPassword);
    expect(again.body.user.cambiarContrasena).toBe(false);
  });
});

describe('Datos de prueba sobre la cuenta inicial', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestApp({seed: false});
    await seedDemoData(ctx.db);
  });
  afterAll(() => ctx.db.close());

  it('deja un solo DIRECTORIO, con la contraseña de prueba y sin pedir cambiarla', async () => {
    const {rows} = await ctx.db.query('SELECT COUNT(*)::int AS total FROM directorio');
    expect(rows[0].total).toBe(1);
    const res = await loginDirectorio(ctx.app, INITIAL_DIRECTORIO_PASSWORD);
    expect(res.body.user.cambiarContrasena).toBe(false);
  });
});
