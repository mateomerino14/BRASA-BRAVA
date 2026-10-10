// Error HTTP con código de estado y mensaje para el cliente
export class HttpError extends Error {
  // Crea el error con su estado HTTP y detalles opcionales
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

// Atajos para los errores HTTP más comunes
export const badRequest = (message, details) => new HttpError(400, message, details);
// Error 401 de sesión inválida
export const unauthorized = (message = 'No autorizado') => new HttpError(401, message);
// Error 403 de permiso denegado
export const forbidden = (message = 'No tiene permisos para realizar esta acción') =>
  new HttpError(403, message);
// Error 404 de recurso inexistente
export const notFound = (message = 'Recurso no encontrado') => new HttpError(404, message);
