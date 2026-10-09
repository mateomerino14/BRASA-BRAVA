// Reglas de negocio de los cargos
export const createRolesService = ({repository}) => ({
  // Devuelve los cargos activos para formularios y filtros
  listActive: async () => {
    const rows = await repository.listActive();
    return {roles: rows.map((row) => ({id: row.id_cargo, nombre: row.nombre}))};
  },
});
