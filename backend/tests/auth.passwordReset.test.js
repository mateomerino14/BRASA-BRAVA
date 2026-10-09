import request from 'supertest';
import {beforeEach, afterEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';

const EMAIL = 'c.mendoza@brasabrava.bo';

// Extrae el código de 6 dígitos del último correo enviado
const lastCode = (mailer) => mailer.outbox.at(-1).html.match(/>(\d{6})</)[1];

// Devuelve un código distinto al real para probar intentos fallidos
const wrongCode = (code) => String((Number(code) + 1) % 1_000_000).padStart(6, '0');

describe('Autenticación: recuperación de contraseña', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await createTestApp();
  });
  afterEach(() => ctx.db.close());

  // Solicita un código para el correo de prueba
  const requestCode = (email = EMAIL) =>
    request(ctx.app).post('/api/auth/password-reset/request').send({email});

  it('envía un código de 6 dígitos al correo registrado', async () => {
    const res = await requestCode();
    expect(res.status).toBe(200);
    expect(ctx.mailer.outbox).toHaveLength(1);
    expect(ctx.mailer.outbox[0].to).toBe(EMAIL);
    expect(lastCode(ctx.mailer)).toMatch(/^\d{6}$/);
  });

  it('responde igual con un correo no registrado y no envía nada', async () => {
    const res = await requestCode('nadie@brasabrava.bo');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Si el correo está registrado/);
    expect(ctx.mailer.outbox).toHaveLength(0);
  });

  it('guarda el código hasheado, nunca en texto plano', async () => {
    await requestCode();
    const {rows} = await ctx.db.query('SELECT codigo_hash FROM codigo_recuperacion');
    expect(rows[0].codigo_hash).not.toBe(lastCode(ctx.mailer));
    expect(rows[0].codigo_hash).toMatch(/^\$2[aby]\$/);
  });

  it('verifica el código correcto', async () => {
    await requestCode();
    const res = await request(ctx.app)
      .post('/api/auth/password-reset/verify')
      .send({email: EMAIL, code: lastCode(ctx.mailer)});
    expect(res.status).toBe(200);
  });

  it('cuenta intentos y bloquea el código al quinto fallo', async () => {
    await requestCode();
    const good = lastCode(ctx.mailer);
    let res;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      res = await request(ctx.app)
        .post('/api/auth/password-reset/verify')
        .send({email: EMAIL, code: wrongCode(good)});
    }
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/bloqueado/);
    const after = await request(ctx.app)
      .post('/api/auth/password-reset/verify')
      .send({email: EMAIL, code: good});
    expect(after.status).toBe(400);
  });

  it('reenviar invalida el código anterior', async () => {
    await requestCode();
    const first = lastCode(ctx.mailer);
    await requestCode();
    const second = lastCode(ctx.mailer);
    const old = await request(ctx.app)
      .post('/api/auth/password-reset/verify')
      .send({email: EMAIL, code: first});
    if (first !== second) {
      expect(old.status).toBe(400);
    }
    const current = await request(ctx.app)
      .post('/api/auth/password-reset/verify')
      .send({email: EMAIL, code: second});
    expect(current.status).toBe(200);
  });

  it('rechaza un código vencido', async () => {
    await requestCode();
    await ctx.db.query("UPDATE codigo_recuperacion SET expira_en = NOW() - INTERVAL '1 minute'");
    const res = await request(ctx.app)
      .post('/api/auth/password-reset/verify')
      .send({email: EMAIL, code: lastCode(ctx.mailer)});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expiró/);
  });

  it('cambia la contraseña, consume el código y permite el nuevo login', async () => {
    await requestCode();
    const code = lastCode(ctx.mailer);
    const res = await request(ctx.app)
      .post('/api/auth/password-reset/confirm')
      .send({email: EMAIL, code, newPassword: 'NuevaClave99'});
    expect(res.status).toBe(200);

    const reuse = await request(ctx.app)
      .post('/api/auth/password-reset/confirm')
      .send({email: EMAIL, code, newPassword: 'OtraClave99'});
    expect(reuse.status).toBe(400);

    const oldLogin = await request(ctx.app)
      .post('/api/auth/login')
      .send({username: 'c.mendoza', password: 'Brasa2026'});
    expect(oldLogin.status).toBe(401);
    const newLogin = await request(ctx.app)
      .post('/api/auth/login')
      .send({username: 'c.mendoza', password: 'NuevaClave99'});
    expect(newLogin.status).toBe(200);
  });

  it('exige una contraseña segura', async () => {
    await requestCode();
    const res = await request(ctx.app)
      .post('/api/auth/password-reset/confirm')
      .send({email: EMAIL, code: lastCode(ctx.mailer), newPassword: 'corta'});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/8 caracteres/);
  });

  it('valida el formato del correo y del código', async () => {
    expect((await requestCode('no-es-correo')).status).toBe(400);
    const res = await request(ctx.app)
      .post('/api/auth/password-reset/verify')
      .send({email: EMAIL, code: '12ab'});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('El código debe tener 6 dígitos');
  });

  it('avisa si el correo no se pudo enviar', async () => {
    await ctx.db.close();
    ctx = await createTestApp({mailer: {send: async () => {
      throw new Error('Brevo caído');
    }}});
    const res = await requestCode();
    expect(res.status).toBe(502);
    expect(res.body.message).toMatch(/No se pudo enviar el correo/);
  });
});
