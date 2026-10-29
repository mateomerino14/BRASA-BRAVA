// Sincroniza los hijos de un registro: actualiza, inserta y da de baja
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
