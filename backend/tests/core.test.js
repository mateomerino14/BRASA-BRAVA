import request from 'supertest';
import {describe, expect, it, vi} from 'vitest';
import {loadConfig} from '../src/config/env.js';
import {createBrevoMailer, createMailer} from '../src/services/mailer.js';
import {createTestApp} from './helpers/testApp.js';

describe('API base', () => {
  it('responde el estado de la API y la base', async () => {
    const ctx = await createTestApp();
    const res = await request(ctx.app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({status: 'ok'});
    await ctx.db.close();
  });

  it('responde 404 en rutas de API inexistentes', async () => {
    const ctx = await createTestApp();
    const res = await request(ctx.app).get('/api/no-existe');
    expect(res.status).toBe(404);
    await ctx.db.close();
  });
});

describe('config', () => {
  it('aplica valores por defecto y separa los orígenes CORS', () => {
    const config = loadConfig({CORS_ORIGINS: 'http://a.com, http://b.com'});
    expect(config.PORT).toBe(3000);
    expect(config.corsOrigins).toEqual(['http://a.com', 'http://b.com']);
    expect(config.RATE_LIMIT_ENABLED).toBe(true);
  });

  it('exige JWT_SECRET propio en producción', () => {
    expect(() => loadConfig({NODE_ENV: 'production'})).toThrow(/JWT_SECRET/);
  });

  it('exige la API key de Brevo si se usa ese driver', () => {
    expect(() => loadConfig({MAIL_DRIVER: 'brevo'})).toThrow(/BREVO_API_KEY/);
  });

  it('rechaza variables con formato inválido', () => {
    expect(() => loadConfig({PORT: 'abc'})).toThrow(/PORT/);
  });
});

describe('mailer', () => {
  it('envía a Brevo con la API key y el remitente', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ok: true});
    const mailer = createBrevoMailer(
      {apiKey: 'key', fromEmail: 'a@b.bo', fromName: 'Brasa'},
      fetchImpl,
    );
    await mailer.send({to: 'x@y.bo', toName: 'X', subject: 'Hola', html: '<p>hi</p>'});
    const [, options] = fetchImpl.mock.calls[0];
    expect(options.headers['api-key']).toBe('key');
    expect(JSON.parse(options.body)).toMatchObject({
      sender: {email: 'a@b.bo'},
      to: [{email: 'x@y.bo'}],
    });
  });

  it('lanza si Brevo responde error', async () => {
    const mailer = createBrevoMailer(
      {apiKey: 'k'},
      vi.fn().mockResolvedValue({ok: false, status: 401}),
    );
    await expect(mailer.send({to: 'x@y.bo'})).rejects.toThrow('401');
  });

  it('en desarrollo usa el mailer de consola', async () => {
    const logger = {info: vi.fn()};
    const mailer = createMailer({MAIL_DRIVER: 'console'}, logger);
    await mailer.send({to: 'x@y.bo', subject: 'S', preview: 'Código: 123456'});
    expect(mailer.outbox).toHaveLength(1);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('123456'));
  });
});
