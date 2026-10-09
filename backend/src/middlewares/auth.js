import {verifyToken} from '../utils/token.js';
import {forbidden, unauthorized} from '../utils/httpError.js';

// Exige un JWT válido en el header Authorization y lo deja en req.user
export const authenticate = (secret) => (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(unauthorized());
  }
  try {
    req.user = verifyToken(token, secret);
    return next();
  }
  catch {
    return next(unauthorized('Sesión inválida o expirada'));
  }
};

// Permite el paso solo al DIRECTORIO o a quien tenga el permiso indicado
export const authorize = (permission) => (req, _res, next) => {
  if (req.user?.isDirectorio || req.user?.permissions?.includes(permission)) {
    return next();
  }
  return next(forbidden());
};
