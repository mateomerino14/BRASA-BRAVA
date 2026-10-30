// Acceso a datos del módulo de autenticación
export const createAuthRepository = (db) => ({
  // Busca un empleado activo por alias, con su cargo
  findActiveEmployeeByAlias: async (alias) => {
    const {rows} = await db.query(
      `SELECT e.id_empleado, e.nombre, e.apellido, e.alias, e.correo, e.foto_url,
              e.contrasena_hash, c.id_cargo, c.nombre AS cargo
         FROM empleado e
         JOIN cargo c ON c.id_cargo = e.id_cargo
        WHERE LOWER(e.alias) = LOWER($1) AND e.activo = TRUE AND c.activo = TRUE`,
      [alias],
    );
    return rows[0] ?? null;
  },

  // Nombre y foto actuales de un empleado
  findProfile: async (idEmpleado) => {
    const {rows} = await db.query('SELECT nombre, apellido, foto_url FROM empleado WHERE id_empleado = $1', [idEmpleado]);
    return rows[0] ?? null;
  },

  // Busca un empleado por correo, activo o dado de baja
  findEmployeeByEmail: async (email) => {
    const {rows} = await db.query(
      'SELECT id_empleado, nombre, correo, activo FROM empleado WHERE LOWER(correo) = LOWER($1)',
      [email],
    );
    return rows[0] ?? null;
  },

  // Busca un empleado activo por correo
  findActiveEmployeeByEmail: async (email) => {
    const {rows} = await db.query(
      `SELECT id_empleado, nombre, correo FROM empleado
        WHERE LOWER(correo) = LOWER($1) AND activo = TRUE`,
      [email],
    );
    return rows[0] ?? null;
  },

  // Lista las pantallas permitidas para un cargo
  findPermissionsByRole: async (idCargo) => {
    const {rows} = await db.query('SELECT pantalla FROM cargo_permiso WHERE id_cargo = $1', [
      idCargo,
    ]);
    return rows.map((row) => row.pantalla);
  },

  // Devuelve la cuenta DIRECTORIO (hay una sola)
  findDirectorio: async () => {
    const {rows} = await db.query(
      'SELECT id_directorio, alias, contrasena_hash, cambiar_contrasena FROM directorio ORDER BY id_directorio LIMIT 1',
    );
    return rows[0] ?? null;
  },

  // Guarda la nueva contraseña del DIRECTORIO y quita el aviso de cambiarla
  updateDirectorioPassword: async (idDirectorio, passwordHash) => {
    await db.query('UPDATE directorio SET contrasena_hash = $1, cambiar_contrasena = FALSE WHERE id_directorio = $2', [passwordHash, idDirectorio]);
  },

  // Lista los empleados activos para el carrusel del login
  listLoginUsers: async () => {
    const {rows} = await db.query(
      `SELECT e.alias, e.nombre, e.apellido, e.foto_url, c.nombre AS cargo
         FROM empleado e JOIN cargo c ON c.id_cargo = e.id_cargo
        WHERE e.activo = TRUE AND c.activo = TRUE
        ORDER BY e.nombre`,
    );
    return rows;
  },

  // Marca como usados los códigos pendientes de un empleado
  invalidateCodes: async (idEmpleado) => {
    await db.query(
      'UPDATE codigo_recuperacion SET usado = TRUE WHERE id_empleado = $1 AND usado = FALSE',
      [idEmpleado],
    );
  },

  // Guarda un nuevo código (hasheado) con su fecha de expiración
  insertCode: async (idEmpleado, codigoHash, expiraEn) => {
    await db.query(
      `INSERT INTO codigo_recuperacion (id_empleado, codigo_hash, expira_en)
       VALUES ($1, $2, $3)`,
      [idEmpleado, codigoHash, expiraEn],
    );
  },

  // Obtiene el código más reciente de un empleado, con su estado
  findLatestCode: async (idEmpleado) => {
    const {rows} = await db.query(
      `SELECT id_codigo, codigo_hash, intentos, usado, expira_en FROM codigo_recuperacion
        WHERE id_empleado = $1
        ORDER BY id_codigo DESC LIMIT 1`,
      [idEmpleado],
    );
    return rows[0] ?? null;
  },

  // Suma un intento fallido y anula el código si llega al máximo
  registerFailedAttempt: async (idCodigo, maxAttempts) => {
    await db.query(
      `UPDATE codigo_recuperacion
          SET intentos = intentos + 1,
              usado = (intentos + 1 >= $2)
        WHERE id_codigo = $1`,
      [idCodigo, maxAttempts],
    );
  },

  // Cambia la contraseña y consume el código dentro de una transacción
  resetPassword: async (idEmpleado, idCodigo, passwordHash) => {
    await db.transaction(async (tx) => {
      await tx.query('UPDATE empleado SET contrasena_hash = $1 WHERE id_empleado = $2', [
        passwordHash,
        idEmpleado,
      ]);
      await tx.query('UPDATE codigo_recuperacion SET usado = TRUE WHERE id_codigo = $1', [
        idCodigo,
      ]);
    });
  },
});
