import {existsSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';
import {cleanUnusedImages} from '../src/services/imageCleanup.js';

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fe0d2fe7a70000000049454e44ae426082', 'hex');
const silent = {info: () => {}};

describe('Limpieza de fotos', () => {
  let ctx;
  let admin;

  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await loginAs(ctx.app, 'admin');
  });
  afterEach(() => ctx.db.close());

  it('borra solo las fotos que ningún registro usa y respeta otros archivos', async () => {
    const {rows} = await ctx.db.query("SELECT id_producto FROM producto WHERE nombre = 'Doble Brava'");
    const saved = await request(ctx.app).put(`/api/products/${rows[0].id_producto}/image`).set('authorization', admin.authorization).attach('imagen', PNG, 'foto.png');
    const usedFile = path.join(ctx.config.UPLOADS_DIR, path.basename(saved.body.product.imagenUrl));
    const orphan = path.join(ctx.config.UPLOADS_DIR, '0b7e1c52-5a1f-4d9e-9a51-3f0d2c7a9b11.jpg');
    const foreign = path.join(ctx.config.UPLOADS_DIR, 'leeme.txt');
    await writeFile(orphan, PNG);
    await writeFile(foreign, 'no tocar');

    expect(await cleanUnusedImages({db: ctx.db, directory: ctx.config.UPLOADS_DIR, logger: silent})).toBe(1);
    expect(existsSync(orphan)).toBe(false);
    expect(existsSync(usedFile)).toBe(true);
    expect(existsSync(foreign)).toBe(true);
  });

  it('no falla si la carpeta de fotos todavía no existe', async () => {
    expect(await cleanUnusedImages({db: ctx.db, directory: path.join(ctx.config.UPLOADS_DIR, 'nueva'), logger: silent})).toBe(0);
  });
});

describe('Foto que no se pudo asociar', () => {
  it('borra la foto nueva si falla guardar su URL en la base', async () => {
    const {createImageActions} = await import('../src/modules/shared/imageActions.js');
    const removed = [];
    const actions = createImageActions({
      repository: {findById: async () => ({imagen_url: '/uploads/vieja.png'}), setImage: async () => {
        throw new Error('base caída');
      }},
      images: {save: async () => ({url: '/uploads/nueva.png'}), remove: async (url) => removed.push(url)},
      getById: async () => ({}),
      notFound: {error: 'No existe', status: 404},
    });
    await expect(actions.setImage(1, Buffer.from(''))).rejects.toThrow('base caída');
    expect(removed).toEqual(['/uploads/nueva.png']);
  });
});
