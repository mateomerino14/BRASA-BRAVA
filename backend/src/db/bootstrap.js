import {hashSecret} from '../utils/password.js';

export const DIRECTORIO_ALIAS = 'DIRECTORIO';
export const INITIAL_DIRECTORIO_PASSWORD = 'Directorio2026';

// Crea la cuenta del DIRECTORIO si la base no tiene ninguna, con la contraseña inicial y el aviso de cambiarla
export const ensureDirectorio = async (db) => {
  const {rows} = await db.query('SELECT COUNT(*)::int AS total FROM directorio');
  if (rows[0].total > 0) {
    return false;
  }
  await db.query('INSERT INTO directorio (alias, contrasena_hash, cambiar_contrasena) VALUES ($1, $2, TRUE)', [
    DIRECTORIO_ALIAS,
    await hashSecret(INITIAL_DIRECTORIO_PASSWORD),
  ]);
  return true;
};
