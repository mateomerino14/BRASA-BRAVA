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

// Categorías del menú con sus subcategorías; las de la lista INACTIVE_CATEGORIES quedan de baja
const CATEGORIES = [
  ['Hamburguesas', 'Hamburguesas a la parrilla con pan artesanal', ['Clásicas', 'Especiales', 'Doble Carne']],
  ['Bebidas y Refrescos', 'Gaseosas, jugos y cervezas bien frías', ['Gaseosas', 'Jugos Naturales', 'Cervezas']],
  ['Guarniciones y Extras', 'Acompañamientos para completar el pedido', ['Papas Fritas', 'Aros de Cebolla', 'Salsas Caseras']],
  ['Combos Especiales', 'Promociones armadas para compartir', ['Dúo Parrillero', 'Familiar Brava']],
];

const INACTIVE_CATEGORIES = ['Combos Especiales'];

// Productos demo: [nombre, descripción, precio, subcategoría, activo, disponible]
const PRODUCTS = [
  ['Hamburguesa Clásica', 'Carne a la parrilla, queso, lechuga y tomate', 35, 'Clásicas', true, true],
  ['Cheeseburger', 'Doble queso cheddar y pepinillos', 38, 'Clásicas', true, true],
  ['Brava BBQ', 'Salsa barbacoa, tocino y aros de cebolla', 48, 'Especiales', true, true],
  ['Hamburguesa Hawaiana', 'Piña a la plancha y jamón', 45, 'Especiales', false, true],
  ['Doble Brava', 'Dos carnes, doble queso y salsa de la casa', 58, 'Doble Carne', true, true],
  ['Gaseosa 500 ml', 'Sabores surtidos', 10, 'Gaseosas', true, true],
  ['Jugo de Naranja', 'Exprimido al momento', 15, 'Jugos Naturales', true, true],
  ['Cerveza Artesanal', 'Rubia de la casa, 330 ml', 25, 'Cervezas', true, false],
  ['Papas Fritas Clásicas', 'Porción mediana', 15, 'Papas Fritas', true, true],
  ['Aros de Cebolla', 'Rebozados y crocantes', 18, 'Aros de Cebolla', true, true],
  ['Salsa de la Casa', 'Porción extra', 5, 'Salsas Caseras', true, true],
  ['Dúo Parrillero', 'Dos hamburguesas clásicas, papas y gaseosas', 85, 'Dúo Parrillero', true, true],
];

// Inserta los productos demo si la tabla está vacía
const seedProducts = async (db) => {
  const {rows} = await db.query('SELECT COUNT(*)::int AS total FROM producto');
  if (rows[0].total > 0) {
    return false;
  }
  for (const [nombre, descripcion, precio, subcategory, activo, disponible] of PRODUCTS) {
    await db.query(
      `INSERT INTO producto (nombre, descripcion, precio, id_subcategoria, activo, disponible)
       SELECT $1, $2, $3::numeric, id_subcategoria, $5::boolean, $6::boolean FROM subcategoria WHERE nombre = $4 LIMIT 1`,
      [nombre, descripcion, precio, subcategory, activo, disponible],
    );
  }
  return true;
};

// Inserta las categorías demo si la tabla está vacía
const seedCategories = async (db) => {
  const {rows} = await db.query('SELECT COUNT(*)::int AS total FROM categoria');
  if (rows[0].total > 0) {
    return false;
  }
  for (const [nombre, descripcion, subcategories] of CATEGORIES) {
    const inserted = await db.query(
      'INSERT INTO categoria (nombre, descripcion, activa) VALUES ($1, $2, $3) RETURNING id_categoria',
      [nombre, descripcion, !INACTIVE_CATEGORIES.includes(nombre)],
    );
    for (const subcategory of subcategories) {
      await db.query('INSERT INTO subcategoria (id_categoria, nombre) VALUES ($1, $2)', [inserted.rows[0].id_categoria, subcategory]);
    }
  }
  return true;
};

// Inserta cargos, empleados y el DIRECTORIO de demostración si la base está vacía
const seedStaff = async (
  db,
  {password, directorioPassword},
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

// Insumos demo: [nombre, unidad, stock actual, stock mínimo]
const INGREDIENTS = [
  ['Carne de res', 'kg', 12, 5],
  ['Pan de hamburguesa', 'unidad', 40, 30],
  ['Queso cheddar', 'kg', 1.5, 2],
  ['Tomate', 'kg', 3, 1],
  ['Lechuga', 'unidad', 0, 5],
  ['Tocino', 'kg', 1.5, 1],
  ['Cebolla', 'kg', 4, 2],
  ['Papas', 'kg', 20, 8],
  ['Aceite', 'l', 6, 4],
  ['Gaseosa 500 ml', 'unidad', 48, 24],
  ['Naranja', 'kg', 5, 3],
  ['Cerveza artesanal 330 ml', 'unidad', 0, 12],
];

// Inserta los insumos demo con su inventario inicial en el historial, si la tabla está vacía
const seedIngredients = async (db) => {
  const {rows} = await db.query('SELECT COUNT(*)::int AS total FROM insumo');
  if (rows[0].total > 0) {
    return false;
  }
  for (const [nombre, unidad, stock, minimo] of INGREDIENTS) {
    const inserted = await db.query(
      'INSERT INTO insumo (nombre, unidad, stock_actual, stock_minimo) VALUES ($1, $2, $3::numeric, $4::numeric) RETURNING id_insumo',
      [nombre, unidad, stock, minimo],
    );
    if (stock > 0) {
      await db.query(
        `INSERT INTO movimiento_stock (id_insumo, tipo, cantidad, stock_resultante, motivo, responsable)
         VALUES ($1, 'entrada', $2::numeric, $2::numeric, 'Inventario inicial', 'admin')`,
        [inserted.rows[0].id_insumo, stock],
      );
    }
  }
  return true;
};

// Recetas demo: producto → [insumo, cantidad por porción]
const RECIPES = {
  'Hamburguesa Clásica': [['Carne de res', 0.15], ['Pan de hamburguesa', 1], ['Queso cheddar', 0.03], ['Tomate', 0.04], ['Lechuga', 1]],
  'Cheeseburger': [['Carne de res', 0.15], ['Pan de hamburguesa', 1], ['Queso cheddar', 0.06]],
  'Brava BBQ': [['Carne de res', 0.18], ['Pan de hamburguesa', 1], ['Tocino', 0.05], ['Cebolla', 0.05]],
  'Doble Brava': [['Carne de res', 0.3], ['Pan de hamburguesa', 1], ['Queso cheddar', 0.06]],
  'Papas Fritas Clásicas': [['Papas', 0.25], ['Aceite', 0.05]],
  'Gaseosa 500 ml': [['Gaseosa 500 ml', 1]],
  'Jugo de Naranja': [['Naranja', 0.4]],
  'Cerveza Artesanal': [['Cerveza artesanal 330 ml', 1]],
};

// Inserta las recetas demo si la tabla está vacía
const seedRecipes = async (db) => {
  const {rows} = await db.query('SELECT COUNT(*)::int AS total FROM receta');
  if (rows[0].total > 0) {
    return false;
  }
  for (const [product, items] of Object.entries(RECIPES)) {
    for (const [ingredient, cantidad] of items) {
      await db.query(
        `INSERT INTO receta (id_producto, id_insumo, cantidad)
         SELECT p.id_producto, i.id_insumo, $3::numeric FROM producto p, insumo i WHERE p.nombre = $1 AND i.nombre = $2`,
        [product, ingredient, cantidad],
      );
    }
  }
  return true;
};

// Carga cada bloque de datos demo que falte; devuelve true si insertó algo
export const seedDemoData = async (db, {password = 'Brasa2026', directorioPassword = 'Directorio2026'} = {}) => {
  const staff = await seedStaff(db, {password, directorioPassword});
  const categories = await seedCategories(db);
  const products = await seedProducts(db);
  const ingredients = await seedIngredients(db);
  const recipes = await seedRecipes(db);
  return staff || categories || products || ingredients || recipes;
};
