import {respond} from '../../utils/respond.js';

const resetRequested = 'Le enviamos un código de verificación a su correo';

// Controladores HTTP del módulo de autenticación
export const createAuthController = (service) => ({
  // Inicia sesión y devuelve el token con el perfil
  login: async (req, res) => {
    const result = await service.login(req.validated.body);
    return respond(res, result, ({session}) => res.json(session));
  },

  // Devuelve el perfil de la sesión actual
  me: async (req, res) => {
    const {iat: _iat, exp: _exp, ...user} = req.user;
    return res.json({user: await service.profile(user)});
  },

  // Lista los empleados para el carrusel del login
  loginUsers: async (_req, res) => {
    const result = await service.listLoginUsers();
    return res.json({users: result.users});
  },

  // Envía el código de verificación al correo indicado
  requestReset: async (req, res) => {
    const result = await service.requestPasswordReset(req.validated.body);
    return respond(res, result, () => res.json({message: resetRequested, venceEn: result.expiresAt}));
  },

  // Verifica el código ingresado sin consumirlo
  verifyReset: async (req, res) => {
    const result = await service.verifyResetCode(req.validated.body);
    return respond(res, result, () => res.json({message: 'Código verificado'}));
  },

  // Cambia la contraseña con el código verificado
  confirmReset: async (req, res) => {
    const result = await service.confirmPasswordReset(req.validated.body);
    return respond(res, result, () => res.json({message: 'Contraseña actualizada correctamente'}));
  },
});
