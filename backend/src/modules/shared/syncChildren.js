// Sincroniza una lista de hijos (subcategorías, mesas) con la enviada por el formulario:
// los que traen un id existente se actualizan, los nuevos se insertan y los que faltan se dan de baja (no se borran)
export const syncChildren = async ({existingIds, incoming, update, insert, deactivateExcept}) => {
  const current = new Set(existingIds);
  const keepIds = incoming.filter((item) => item.id && current.has(item.id)).map((item) => item.id);
  await deactivateExcept(keepIds);
  for (const item of incoming) {
    if (item.id && current.has(item.id)) {
      await update(item);
    }
    else {
      await insert(item);
    }
  }
};
