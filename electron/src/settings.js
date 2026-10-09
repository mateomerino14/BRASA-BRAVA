import {randomBytes} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const FILE_NAME = 'brasa-brava.json';

// Crea la configuración inicial con secretos aleatorios para esta PC
const createDefaults = () => ({
  jwtSecret: randomBytes(48).toString('hex'),
  dbPassword: randomBytes(24).toString('hex'),
  mailDriver: 'console',
  brevoApiKey: '',
  seedDemoData: true,
});

// Lee la configuración local (la crea la primera vez) y completa claves nuevas
export const loadSettings = (dataDir) => {
  mkdirSync(dataDir, {recursive: true});
  const file = path.join(dataDir, FILE_NAME);
  let stored = {};
  if (existsSync(file)) {
    stored = JSON.parse(readFileSync(file, 'utf8'));
  }
  const settings = {...createDefaults(), ...stored};
  if (JSON.stringify(settings) !== JSON.stringify(stored)) {
    writeFileSync(file, JSON.stringify(settings, null, 2), {mode: 0o600});
  }
  return settings;
};
