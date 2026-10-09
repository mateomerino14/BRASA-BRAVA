import {mkdtempSync, readFileSync, rmSync, statSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {afterAll, describe, expect, it} from 'vitest';
import {loadSettings} from '../src/settings.js';
import {findFreePort, startDesktopServices} from '../src/services.js';

const tempDirs = [];

// Crea una carpeta temporal que se borra al terminar
const tempDir = () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'brasa-desktop-'));
  tempDirs.push(dir);
  return dir;
};

afterAll(() => tempDirs.forEach((dir) => rmSync(dir, {recursive: true, force: true})));

describe('configuración local', () => {
  it('genera secretos una sola vez y los conserva', () => {
    const dir = tempDir();
    const first = loadSettings(dir);
    const second = loadSettings(dir);
    expect(first.jwtSecret).toHaveLength(96);
    expect(second.jwtSecret).toBe(first.jwtSecret);
    const file = path.join(dir, 'brasa-brava.json');
    expect(JSON.parse(readFileSync(file, 'utf8')).dbPassword).toBe(first.dbPassword);
    if (process.platform !== 'win32') {
      expect(statSync(file).mode & 0o777).toBe(0o600);
    }
  });

  it('encuentra puertos libres', async () => {
    const port = await findFreePort();
    expect(port).toBeGreaterThan(1024);
  });
});

// Postgres no se deja ejecutar como root; en CI y en Windows corre normal
const canRunPostgres = process.getuid?.() !== 0;

describe.runIf(canRunPostgres)('servicios de escritorio (Postgres embebido real)', () => {
  it('arranca base + API, carga datos demo, inicia sesión y se detiene', async () => {
    const dataDir = tempDir();
    const services = await startDesktopServices({
      dataDir,
      staticDir: undefined,
      settings: loadSettings(dataDir),
    });
    try {
      const health = await fetch(`${services.url}/api/health`).then((res) => res.json());
      expect(health).toEqual({status: 'ok'});
      const login = await fetch(`${services.url}/api/auth/login`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({username: 'DIRECTORIO', password: 'Directorio2026'}),
      });
      expect(login.status).toBe(200);
    }
    finally {
      await services.stop();
    }
  }, 120_000);
});
