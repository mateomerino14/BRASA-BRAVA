import {rateLimit} from 'express-rate-limit';

const limitWindowMs = 15 * 60_000;
const tooManyAttempts = {message: 'Demasiados intentos. Espere unos minutos e intente de nuevo'};

// Limita los intentos por IP en rutas sensibles (contraseñas, códigos)
export const createLimiter = (enabled, limit) => {
  if (!enabled) {
    return (_req, _res, next) => next();
  }
  return rateLimit({windowMs: limitWindowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false, message: tooManyAttempts});
};
