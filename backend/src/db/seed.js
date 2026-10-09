import {hashSecret} from '../utils/password.js';
import {SCREENS} from '../modules/auth/permissions.js';

// Datos de demostración basados en el prototipo de Figma
const ROLES = {
  Administrador: SCREENS,
  Cajero: ['home', 'familia', 'caja'],
  Mesero: ['home', 'familia', 'caja'],
  Cocinero: ['home', 'familia'],
};

const EMPLOYEES = [
  ['Carlos', 'Mendoza', '4920114 LP', 'c.mendoza', 'c.mendoza@brasabrava.bo', '71234567', 'Mesero'],
  ['Andrea', 'Romero', '6812903 LP', 'a.romero', 'a.romero@brasabrava.bo', '76543210', 'Cajero'],
  [
    'Roberto',
    'Sánchez',
    '3209110 CBBA',
    'r.sanchez',
    'r.sanchez@brasabrava.bo',
    '79812345',
    'Cocinero',
  ],
  ['Marco', 'Vargas', '5214789 LP', 'admin', 'admin@brasabrava.bo', '70112233', 'Administrador'],
  ['Javier', 'Ortiz', '5912440 LP', 'j.ortiz', 'j.ortiz@brasabrava.bo', '78901234', 'Mesero'],
];

// Empleados de demostración que ya fueron dados de baja
const INACTIVE_ALIASES = ['j.ortiz'];

// Inserta cargos, empleados y el DIRECTORIO de demostración si la base está vacía
export const seedDemoData = async (
  db,
  {password = 'Brasa2026', directorioPassword = 'Directorio2026'} = {},
) => {
  const {rows} = await db.query('SELECT COUNT(*)::int AS total FROM cargo');
  if (rows[0].total > 0) {
    return false;
  }
  const roleIds = {};
  for (const [name, screens] of Object.entries(ROLES)) {
    const inserted = await db.query('INSERT INTO cargo (nombre) VALUES ($1) RETURNING id_cargo', [
      name,
    ]);
    roleIds[name] = inserted.rows[0].id_cargo;
    for (const screen of screens) {
      await db.query('INSERT INTO cargo_permiso (id_cargo, pantalla) VALUES ($1, $2)', [
        roleIds[name],
        screen,
      ]);
    }
  }
  const hash = await hashSecret(password);
  for (const [nombre, apellido, ci, alias, correo, telefono, cargo] of EMPLOYEES) {
    await db.query(
      `INSERT INTO empleado (nombre, apellido, ci, alias, correo, telefono, contrasena_hash, id_cargo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [nombre, apellido, ci, alias, correo, telefono, hash, roleIds[cargo]],
    );
  }
  for (const alias of INACTIVE_ALIASES) {
    await db.query('UPDATE empleado SET activo = FALSE WHERE alias = $1', [alias]);
  }
  await db.query('INSERT INTO directorio (alias, contrasena_hash) VALUES ($1, $2)', [
    'DIRECTORIO',
    await hashSecret(directorioPassword),
  ]);
  return true;
};
