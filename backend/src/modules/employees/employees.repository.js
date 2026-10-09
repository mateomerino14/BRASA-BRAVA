const employeeColumns = `e.id_empleado, e.nombre, e.apellido, e.ci, e.alias, e.correo, e.telefono,
       e.foto_url, e.activo, e.id_cargo, c.nombre AS cargo`;

// Arma el WHERE del listado según los filtros recibidos
const buildFilters = ({search, idCargo, estado}) => {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(LOWER(e.nombre || ' ' || e.apellido) LIKE LOWER($${params.length})
      OR LOWER(e.alias) LIKE LOWER($${params.length}) OR LOWER(e.ci) LIKE LOWER($${params.length}))`);
  }
  if (idCargo) {
    params.push(idCargo);
    conditions.push(`e.id_cargo = $${params.length}`);
  }
  if (estado === 'activos') {
    conditions.push('e.activo = TRUE');
  }
  if (estado === 'inactivos') {
    conditions.push('e.activo = FALSE');
  }
  let where = '';
  if (conditions.length > 0) {
    where = `WHERE ${conditions.join(' AND ')}`;
  }
  return {where, params};
};

// Acceso a datos de empleados (solo SQL, sin reglas de negocio)
export const createEmployeesRepository = (db) => ({
  // Lista una página de empleados con los filtros dados
  list: async ({search, idCargo, estado, page, pageSize}) => {
    const {where, params} = buildFilters({search, idCargo, estado});
    const offset = (page - 1) * pageSize;
    const {rows} = await db.query(
      `SELECT ${employeeColumns}
         FROM empleado e JOIN cargo c ON c.id_cargo = e.id_cargo
         ${where}
        ORDER BY e.activo DESC, e.nombre, e.apellido
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset],
    );
    return rows;
  },

  // Cuenta los empleados que cumplen los filtros
  count: async (filters) => {
    const {where, params} = buildFilters(filters);
    const {rows} = await db.query(
      `SELECT COUNT(*)::int AS total FROM empleado e ${where}`,
      params,
    );
    return rows[0].total;
  },

  // Busca un empleado por id con su cargo
  findById: async (id) => {
    const {rows} = await db.query(
      `SELECT ${employeeColumns}
         FROM empleado e JOIN cargo c ON c.id_cargo = e.id_cargo
        WHERE e.id_empleado = $1`,
      [id],
    );
    return rows[0] ?? null;
  },

  // Busca otro empleado que ya use el CI, el usuario o el correo
  findDuplicate: async ({ci, alias, correo}, excludeId = 0) => {
    const {rows} = await db.query(
      `SELECT ci, alias, correo FROM empleado
        WHERE id_empleado <> $4 AND (ci = $1 OR LOWER(alias) = LOWER($2) OR LOWER(correo) = LOWER($3))
        LIMIT 1`,
      [ci, alias, correo, excludeId],
    );
    return rows[0] ?? null;
  },

  // Indica si el cargo existe y está activo
  roleIsActive: async (idCargo) => {
    const {rows} = await db.query('SELECT 1 FROM cargo WHERE id_cargo = $1 AND activo = TRUE', [idCargo]);
    return rows.length > 0;
  },

  // Inserta un empleado y devuelve su id
  insert: async (data) => {
    const {rows} = await db.query(
      `INSERT INTO empleado (nombre, apellido, ci, alias, correo, telefono, contrasena_hash, id_cargo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_empleado`,
      [data.nombre, data.apellido, data.ci, data.alias, data.correo, data.telefono, data.contrasenaHash, data.idCargo],
    );
    return rows[0].id_empleado;
  },

  // Actualiza los datos de un empleado (y su contraseña si se envía)
  update: async (id, data) => {
    await db.query(
      `UPDATE empleado
          SET nombre = $1, apellido = $2, ci = $3, alias = $4, correo = $5, telefono = $6, id_cargo = $7,
              contrasena_hash = COALESCE($8, contrasena_hash)
        WHERE id_empleado = $9`,
      [data.nombre, data.apellido, data.ci, data.alias, data.correo, data.telefono, data.idCargo, data.contrasenaHash, id],
    );
  },

  // Activa o da de baja a un empleado
  setActive: async (id, activo) => {
    await db.query('UPDATE empleado SET activo = $1 WHERE id_empleado = $2', [activo, id]);
  },
});
