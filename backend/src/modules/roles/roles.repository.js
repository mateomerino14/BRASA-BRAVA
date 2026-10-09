// Acceso a datos de cargos (solo SQL, sin reglas de negocio)
export const createRolesRepository = (db) => ({
  // Lista los cargos activos ordenados por nombre
  listActive: async () => {
    const {rows} = await db.query('SELECT id_cargo, nombre FROM cargo WHERE activo = TRUE ORDER BY nombre');
    return rows;
  },
});
