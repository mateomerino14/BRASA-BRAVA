import {Router} from 'express';
import {rateLimit} from 'express-rate-limit';
import {validate} from '../../middlewares/validate.js';
import {authenticate} from '../../middlewares/auth.js';
import {createAuthRepository} from './auth.repository.js';
import {createAuthService} from './auth.service.js';
import {createAuthController} from './auth.controller.js';
import {loginSchema, resetConfirmSchema, resetRequestSchema, resetVerifySchema} from './auth.schemas.js';

const limitWindowMs = 15 * 60_000;
const loginAttemptsLimit = 20;
const resetAttemptsLimit = 10;

// Limita los intentos por IP en rutas sensibles (se desactiva en las pruebas)
const createLimiter = (enabled, limit) => {
  if (!enabled) {
    return (_req, _res, next) => next();
  }
  return rateLimit({windowMs: limitWindowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false});
};

// Declara las rutas /api/auth con sus validaciones y límites
export const createAuthRouter = ({db, mailer, config, logger}) => {
  const service = createAuthService({repository: createAuthRepository(db), mailer, config, logger});
  const controller = createAuthController(service);
  const loginLimiter = createLimiter(config.RATE_LIMIT_ENABLED, loginAttemptsLimit);
  const resetLimiter = createLimiter(config.RATE_LIMIT_ENABLED, resetAttemptsLimit);
  const router = Router();

  router.post('/login', loginLimiter, validate(loginSchema), controller.login);
  router.get('/me', authenticate(config.JWT_SECRET), controller.me);
  router.get('/login-users', controller.loginUsers);
  router.post('/password-reset/request', resetLimiter, validate(resetRequestSchema), controller.requestReset);
  router.post('/password-reset/verify', resetLimiter, validate(resetVerifySchema), controller.verifyReset);
  router.post('/password-reset/confirm', resetLimiter, validate(resetConfirmSchema), controller.confirmReset);

  return router;
};
