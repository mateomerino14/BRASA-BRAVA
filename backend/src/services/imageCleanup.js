import {createImageStorage} from './imageStorage.js';

// Columnas que guardan la URL de una foto
const IMAGE_COLUMNS = [
  ['categoria', 'imagen_url'],
  ['producto', 'imagen_url'],
  ['promocion', 'imagen_url'],
  ['empleado', 'foto_url'],
];

// Al arrancar, borra de la carpeta de fotos las que ya no tiene ningún registro (por ejemplo de un corte a mitad de una subida)
export const cleanUnusedImages = async ({db, directory, logger = console}) => {
  const used = [];
  for (const [table, column] of IMAGE_COLUMNS) {
    const {rows} = await db.query(`SELECT ${column} AS url FROM ${table} WHERE ${column} IS NOT NULL`);
    used.push(...rows.map((row) => row.url));
  }
  const removed = await createImageStorage(directory).removeUnused(used);
  if (removed > 0) {
    logger.info(`Se borraron ${removed} fotos que ya no usaba ningún registro`);
  }
  return removed;
};
