import {HttpError} from '../utils/httpError.js';

// Responde 404 para rutas de la API o archivos subidos que no existen
export const notFoundHandler = (_req, res) => {
  res.status(404).json({message: 'Ruta no encontrada'});
};

// Convierte cualquier error en una respuesta JSON sin filtrar detalles internos
export const errorHandler = (logger) => (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({message: error.message, details: error.details});
  }
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({message: 'JSON mal formado'});
  }
  logger.error(error);
  return res.status(500).json({message: 'Error interno del servidor'});
};
