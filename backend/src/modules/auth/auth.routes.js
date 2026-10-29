import {Router} from 'express';
import {validate} from '../../middlewares/validate.js';
import {authenticate} from '../../middlewares/auth.js';
import {createLimiter} from '../../middlewares/rateLimit.js';
import {createAuthRepository} from './auth.repository.js';
import {createAuthService} from './auth.service.js';
import {createAuthController} from './auth.controller.js';
import {directorioPasswordSchema, loginSchema, resetConfirmSchema, resetRequestSchema, resetVerifySchema} from './auth.schemas.js';

const loginAttemptsLimit = 20;
const resetAttemptsLimit = 10;

// Declara las rutas /api/auth con sus validaciones y límites
export const createAuthRouter = ({db, mailer, config, logger}) => {
  const service = createAuthService({repository: createAuthRepository(db), mailer, config, logger});
  const controller = createAuthController(service);
  const loginLimiter = createLimiter(config.RATE_LIMIT_ENABLED, loginAttemptsLimit);
  const resetLimiter = createLimiter(config.RATE_LIMIT_ENABLED, resetAttemptsLimit);
  const router = Router();

  router.post('/login', loginLimiter, validate(loginSchema), controller.login);
  router.get('/me', authenticate(config.JWT_SECRET), controller.me);
  router.put('/directorio/password', authenticate(config.JWT_SECRET), resetLimiter, validate(directorioPasswordSchema), controller.changeDirectorioPassword);
  router.get('/login-users', controller.loginUsers);
  router.post('/password-reset/request', resetLimiter, validate(resetRequestSchema), controller.requestReset);
  router.post('/password-reset/verify', resetLimiter, validate(resetVerifySchema), controller.verifyReset);
  router.post('/password-reset/confirm', resetLimiter, validate(resetConfirmSchema), controller.confirmReset);

  return router;
};
