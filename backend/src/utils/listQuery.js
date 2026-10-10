import {z} from 'zod';

const DEFAULT_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 50;
const MAX_SEARCH_LENGTH = 60;

const DIRECTIONS = {asc: 'ASC', desc: 'DESC'};

// Campos comunes de todos los listados: búsqueda, estado, página, tamaño y orden por una columna permitida
export const listQuerySchema = (sortKeys, extraFields = {}) => z.object({
  search: z.string().trim().max(MAX_SEARCH_LENGTH).optional().default(''),
  estado: z.enum(['todos', 'activos', 'inactivos']).optional().default('todos'),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).optional().default(DEFAULT_PAGE_SIZE),
  sort: z.enum(sortKeys).optional(),
  dir: z.enum(['asc', 'desc']).optional().default('asc'),
  ...extraFields,
});

// Arma el ORDER BY con columnas de una lista blanca; sin "sort" usa el orden por defecto del módulo
export const orderClause = (sortColumns, {sort, dir}, defaultOrder) => {
  const columns = sortColumns[sort];
  if (!columns) {
    return `ORDER BY ${defaultOrder}`;
  }
  const direction = DIRECTIONS[dir];
  return `ORDER BY ${columns.map((column) => `${column} ${direction}`).join(', ')}, ${defaultOrder}`;
};

// Agrega LIMIT/OFFSET con parámetros numerados después de los filtros
export const pageClause = (params, {page, pageSize}) => ({
  sql: `LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
  params: [...params, pageSize, (page - 1) * pageSize],
});
