// Controladores HTTP de los cargos
export const createRolesController = (service) => ({
  // Lista los cargos activos
  list: async (_req, res) => {
    const result = await service.listActive();
    return res.json(result);
  },
});
