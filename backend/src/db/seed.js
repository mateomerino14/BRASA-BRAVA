import {hashSecret} from '../utils/password.js';
import {SCREENS} from '../modules/auth/permissions.js';
import {localToday} from '../utils/calendar.js';

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

// Mesas numeradas con una capacidad: tables('Mesa', 1, 3, 4) → Mesa 1..Mesa 3 de 4 personas
const tables = (prefix, from, to, capacidad) => Array.from({length: to - from + 1}, (_, index) => [`${prefix} ${from + index}`, capacidad]);

// Secciones demo: [nombre, descripción, activa, mesas]
const SECTIONS = [
  ['Salón principal', 'Planta baja, junto a la parrilla', true, [...tables('Mesa', 1, 8, 4), ...tables('Mesa', 9, 10, 6)]],
  ['Terraza', 'Al aire libre, con vista a la calle', true, tables('Terraza', 1, 4, 4)],
  ['Barra', 'Banquetas frente a la cocina', true, tables('Barra', 1, 3, 2)],
  ['Salón VIP', 'Reservas para eventos', false, tables('VIP', 1, 2, 8)],
];

// Inserta las secciones demo con sus mesas si la tabla está vacía
const seedSections = async (db) => {
  const {rows} = await db.query('SELECT COUNT(*)::int AS total FROM seccion');
  if (rows[0].total > 0) {
    return false;
  }
  for (const [nombre, descripcion, activa, items] of SECTIONS) {
    const inserted = await db.query(
      'INSERT INTO seccion (nombre, descripcion, activa) VALUES ($1, $2, $3) RETURNING id_seccion',
      [nombre, descripcion, activa],
    );
    for (const [mesa, capacidad] of items) {
      await db.query('INSERT INTO mesa (id_seccion, nombre, capacidad) VALUES ($1, $2, $3)', [inserted.rows[0].id_seccion, mesa, capacidad]);
    }
  }
  return true;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DEMO_TIMEZONE = 'America/La_Paz';

// Fecha YYYY-MM-DD desplazada "days" días desde hoy (en la zona del local)
const shiftDate = (now, days) => localToday(new Date(now.getTime() + days * DAY_MS), DEMO_TIMEZONE).date;

// Promociones demo con fechas relativas a hoy: [nombre, tipo, valor, desde, hasta, días, activa, productos [nombre, cantidad]]
const PROMOTIONS = [
  ['Martes de Hamburguesas', 'descuento', 20, -30, null, '0010000', true, [['Hamburguesa Clásica', 1], ['Cheeseburger', 1]]],
  ['Combo Brava', 'combo', 70, -7, 30, '1111111', true, [['Doble Brava', 1], ['Papas Fritas Clásicas', 1], ['Gaseosa 500 ml', 1]]],
  ['Happy Hour Cervecero', 'descuento', 15, 5, 60, '0111110', true, [['Cerveza Artesanal', 1]]],
  ['Promo Aniversario', 'combo', 99, -40, -3, '1111111', true, [['Brava BBQ', 2], ['Aros de Cebolla', 1]]],
  ['Jueves de Jugos', 'descuento', 10, -20, null, '0000100', false, [['Jugo de Naranja', 1]]],
];

// Inserta las promociones demo si la tabla está vacía
const seedPromotions = async (db, now) => {
  const {rows} = await db.query('SELECT COUNT(*)::int AS total FROM promocion');
  if (rows[0].total > 0) {
    return false;
  }
  for (const [nombre, tipo, valor, desde, hasta, dias, activa, items] of PROMOTIONS) {
    let fin = null;
    if (hasta !== null) {
      fin = shiftDate(now, hasta);
    }
    const inserted = await db.query(
      `INSERT INTO promocion (nombre, tipo, valor, fecha_inicio, fecha_fin, dias, activa)
       VALUES ($1, $2, $3::numeric, $4::date, $5::date, $6, $7) RETURNING id_promocion`,
      [nombre, tipo, valor, shiftDate(now, desde), fin, dias, activa],
    );
    for (const [product, cantidad] of items) {
      await db.query(
        'INSERT INTO promocion_producto (id_promocion, id_producto, cantidad) SELECT $1::int, id_producto, $3::int FROM producto WHERE nombre = $2',
        [inserted.rows[0].id_promocion, product, cantidad],
      );
    }
  }
  return true;
};

const MINUTE_MS = 60 * 1000;

// Ventas abiertas demo: [mesa, mesero, cajero, minutos desde la apertura, líneas [tipo, nombre, cantidad, consumo, ingredientes quitados]]
const OPEN_SALES = [
  ['Mesa 2', 'c.mendoza', 'a.romero', 25, [
    ['producto', 'Hamburguesa Clásica', 1, 'local', ['Tomate']],
    ['producto', 'Hamburguesa Clásica', 1, 'local', []],
    ['promocion', 'Combo Brava', 1, 'local', []],
    ['producto', 'Gaseosa 500 ml', 2, 'local', []],
  ]],
  ['Terraza 1', 'c.mendoza', 'a.romero', 50, [
    ['producto', 'Doble Brava', 1, 'local', []],
    ['producto', 'Papas Fritas Clásicas', 2, 'llevar', []],
    ['producto', 'Jugo de Naranja', 1, 'local', []],
  ]],
];

// Nombre, id y precio unitario de una línea demo (el combo usa su precio fijo)
const demoLinePrice = async (db, tipo, nombre) => {
  if (tipo === 'promocion') {
    const {rows} = await db.query('SELECT id_promocion AS id, valor AS precio FROM promocion WHERE nombre = $1', [nombre]);
    return {idProducto: null, idPromocion: rows[0].id, precio: Number(rows[0].precio)};
  }
  const {rows} = await db.query('SELECT id_producto AS id, precio FROM producto WHERE nombre = $1', [nombre]);
  return {idProducto: rows[0].id, idPromocion: null, precio: Number(rows[0].precio)};
};

// Inserta ventas abiertas demo (mesas ocupadas) si no hay ventas
const seedSales = async (db, now) => {
  const {rows} = await db.query('SELECT COUNT(*)::int AS total FROM venta');
  if (rows[0].total > 0) {
    return false;
  }
  for (const [mesa, mesero, cajero, minutes, lines] of OPEN_SALES) {
    const openedAt = new Date(now.getTime() - minutes * MINUTE_MS);
    const ids = await db.query(
      `SELECT (SELECT id_mesa FROM mesa WHERE nombre = $1 AND activa = TRUE LIMIT 1) AS id_mesa,
              (SELECT id_empleado FROM empleado WHERE alias = $2) AS id_mesero,
              (SELECT id_empleado FROM empleado WHERE alias = $3) AS id_cajero`,
      [mesa, mesero, cajero],
    );
    const {id_mesa: idMesa, id_mesero: idMesero, id_cajero: idCajero} = ids.rows[0];
    let total = 0;
    const priced = [];
    for (const [tipo, nombre, cantidad, consumo, removed] of lines) {
      const price = await demoLinePrice(db, tipo, nombre);
      total += price.precio * cantidad;
      priced.push({...price, nombre, cantidad, consumo, removed});
    }
    const sale = await db.query(
      `INSERT INTO venta (id_mesa, id_mesero, id_cajero, cajero, total, envios, abierta_en)
       VALUES ($1, $2, $3, $4, $5::numeric, 1, $6) RETURNING id_venta`,
      [idMesa, idMesero, idCajero, cajero, total, openedAt],
    );
    await db.query(
      'INSERT INTO venta_envio (id_venta, numero, id_cajero, cajero, id_mesero, creado_en) VALUES ($1, 1, $2, $3, $4, $5)',
      [sale.rows[0].id_venta, idCajero, cajero, idMesero, openedAt],
    );
    for (const line of priced) {
      const detail = await db.query(
        `INSERT INTO venta_detalle (id_venta, envio, id_producto, id_promocion, nombre, precio_unitario, cantidad, consumo, id_mesero, creado_en)
         VALUES ($1, 1, $2, $3, $4, $5::numeric, $6, $7, $8, $9) RETURNING id_detalle`,
        [sale.rows[0].id_venta, line.idProducto, line.idPromocion, line.nombre, line.precio, line.cantidad, line.consumo, idMesero, openedAt],
      );
      for (const insumo of line.removed) {
        await db.query(
          `INSERT INTO venta_detalle_exclusion (id_detalle, id_producto, id_insumo)
           SELECT $1::int, $2::int, id_insumo FROM insumo WHERE nombre = $3`,
          [detail.rows[0].id_detalle, line.idProducto, insumo],
        );
      }
    }
  }
  return true;
};

// Carga cada bloque de datos demo que falte; devuelve true si insertó algo
export const seedDemoData = async (db, {password = 'Brasa2026', directorioPassword = 'Directorio2026', now = new Date()} = {}) => {
  const staff = await seedStaff(db, {password, directorioPassword});
  const categories = await seedCategories(db);
  const products = await seedProducts(db);
  const ingredients = await seedIngredients(db);
  const recipes = await seedRecipes(db);
  const sections = await seedSections(db);
  const promotions = await seedPromotions(db, now);
  const sales = await seedSales(db, now);
  return staff || categories || products || ingredients || recipes || sections || promotions || sales;
};
