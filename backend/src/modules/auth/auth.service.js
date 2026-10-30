import {generateCode} from '../../utils/code.js';
import {DUMMY_HASH, hashSecret, verifySecret} from '../../utils/password.js';
import {signToken} from '../../utils/token.js';
import {SCREENS, normalizePermissions} from './permissions.js';
import {resetCodeEmail} from './resetCodeEmail.js';

const directorioUsername = 'DIRECTORIO';
const invalidCredentials = 'Usuario o contraseña incorrectos';
const invalidCode = {error: 'El código es inválido. Solicite uno nuevo', status: 400, detail: {motivo: 'codigo_invalido'}};
const lockedCode = {error: 'Código bloqueado por demasiados intentos. Solicite uno nuevo', status: 400, detail: {motivo: 'codigo_bloqueado'}};
const expiredCode = {error: 'El código venció. Solicite uno nuevo', status: 400, detail: {motivo: 'codigo_vencido'}};
const unknownAccount = {error: 'No hay ninguna cuenta registrada con ese correo. Revise que esté bien escrito', status: 404};
const inactiveAccount = {error: 'La cuenta de ese correo está dada de baja. Pida a administración que la reactive', status: 403};
const msPerMinute = 60_000;
const onlyDirectorio = {error: 'Solo el DIRECTORIO puede cambiar esta contraseña', status: 403};
const wrongCurrent = {error: 'La contraseña actual no es correcta', status: 400, detail: {campo: 'actual'}};

// Reglas de negocio del inicio de sesión y la recuperación de contraseña
export const createAuthService = ({repository, mailer, config, logger = console, now = () => new Date()}) => {
  // Arma el token y el perfil público de la sesión
  const buildSession = (user) => {
    const token = signToken(user, {secret: config.JWT_SECRET, expiresIn: config.JWT_EXPIRES_IN});
    return {session: {token, user}};
  };

  // Autentica al DIRECTORIO con su contraseña única
  const loginDirectorio = async (password) => {
    const directorio = await repository.findDirectorio();
    const valid = await verifySecret(password, directorio?.contrasena_hash ?? DUMMY_HASH);
    if (!directorio || !valid) {
      return {error: invalidCredentials, status: 401};
    }
    return buildSession({
      id: directorio.id_directorio,
      alias: directorio.alias,
      nombre: directorio.alias,
      cargo: 'Directorio',
      fotoUrl: null,
      isDirectorio: true,
      cambiarContrasena: directorio.cambiar_contrasena,
      permissions: [...SCREENS],
    });
  };

  // Autentica a un empleado activo y carga los permisos de su cargo
  const loginEmployee = async (alias, password) => {
    const employee = await repository.findActiveEmployeeByAlias(alias);
    const valid = await verifySecret(password, employee?.contrasena_hash ?? DUMMY_HASH);
    if (!employee || !valid) {
      return {error: invalidCredentials, status: 401};
    }
    const screens = await repository.findPermissionsByRole(employee.id_cargo);
    return buildSession({
      id: employee.id_empleado,
      alias: employee.alias,
      nombre: `${employee.nombre} ${employee.apellido}`,
      cargo: employee.cargo,
      fotoUrl: employee.foto_url,
      isDirectorio: false,
      permissions: normalizePermissions(screens),
    });
  };

  // Inicia sesión como DIRECTORIO o como empleado según el usuario
  const login = ({username, password}) => {
    if (username.toUpperCase() === directorioUsername) {
      return loginDirectorio(password);
    }
    return loginEmployee(username, password);
  };

  // Devuelve los empleados visibles en el carrusel del login
  const listLoginUsers = async () => {
    const rows = await repository.listLoginUsers();
    const users = rows.map((row) => ({
      alias: row.alias,
      nombre: `${row.nombre} ${row.apellido}`,
      cargo: row.cargo,
      fotoUrl: row.foto_url,
    }));
    return {users};
  };

  // Genera y envía un código al correo de un empleado activo
  const requestPasswordReset = async ({email}) => {
    const employee = await repository.findEmployeeByEmail(email);
    if (!employee) {
      return unknownAccount;
    }
    if (!employee.activo) {
      return inactiveAccount;
    }
    const code = generateCode();
    const expiresAt = new Date(now().getTime() + config.RESET_CODE_TTL_MINUTES * msPerMinute);
    await repository.invalidateCodes(employee.id_empleado);
    await repository.insertCode(employee.id_empleado, await hashSecret(code), expiresAt);
    try {
      await mailer.send({
        to: employee.correo,
        toName: employee.nombre,
        subject: 'Código de verificación - Brasa Brava',
        preview: `Código: ${code}`,
        html: resetCodeEmail({name: employee.nombre, code, minutes: config.RESET_CODE_TTL_MINUTES}),
      });
    }
    catch (error) {
      logger.error?.(`Error enviando el código a ${employee.correo}: ${error.message}`);
      return {error: 'No se pudo enviar el correo. Intente nuevamente', status: 502};
    }
    return {sent: true, expiresAt: expiresAt.toISOString(), simulado: !mailer.delivers};
  };

  // Arma el error de un código incorrecto según los intentos que le quedan
  const failedAttempt = (record) => {
    const remaining = config.RESET_CODE_MAX_ATTEMPTS - record.intentos - 1;
    if (remaining > 0) {
      return {
        error: `Código incorrecto. Le quedan ${remaining} intento(s)`,
        status: 400,
        detail: {motivo: 'codigo_incorrecto', intentosRestantes: remaining},
      };
    }
    return lockedCode;
  };

  // Comprueba el código más reciente: bloqueado, vencido, ya usado o incorrecto
  const checkCode = async ({email, code}) => {
    const employee = await repository.findActiveEmployeeByEmail(email);
    if (!employee) {
      return invalidCode;
    }
    const record = await repository.findLatestCode(employee.id_empleado);
    if (!record) {
      return invalidCode;
    }
    if (record.intentos >= config.RESET_CODE_MAX_ATTEMPTS) {
      return lockedCode;
    }
    if (record.usado) {
      return invalidCode;
    }
    if (new Date(record.expira_en) <= now()) {
      return expiredCode;
    }
    const valid = await verifySecret(code, record.codigo_hash);
    if (!valid) {
      await repository.registerFailedAttempt(record.id_codigo, config.RESET_CODE_MAX_ATTEMPTS);
      return failedAttempt(record);
    }
    return {employee, record};
  };

  // Valida el código sin consumirlo (paso de verificación de identidad)
  const verifyResetCode = async (input) => {
    const result = await checkCode(input);
    if (result.error) {
      return result;
    }
    return {verified: true};
  };

  // Valida el código y guarda la nueva contraseña
  const confirmPasswordReset = async ({email, code, newPassword}) => {
    const result = await checkCode({email, code});
    if (result.error) {
      return result;
    }
    const passwordHash = await hashSecret(newPassword);
    await repository.resetPassword(result.employee.id_empleado, result.record.id_codigo, passwordHash);
    return {updated: true};
  };

  // Perfil de la sesión con el nombre y la foto actuales (y, del DIRECTORIO, si debe cambiar la contraseña)
  const profile = async (user) => {
    if (user.isDirectorio) {
      const directorio = await repository.findDirectorio();
      return {...user, cambiarContrasena: Boolean(directorio?.cambiar_contrasena)};
    }
    const row = await repository.findProfile(user.id);
    if (!row) {
      return user;
    }
    return {...user, nombre: `${row.nombre} ${row.apellido}`, fotoUrl: row.foto_url};
  };

  // Datos de la sesión sin los campos que agrega el token (iat, exp)
  const sessionUser = (user) => {
    const {iat: _iat, exp: _exp, ...rest} = user;
    return rest;
  };

  // Cambia la contraseña del DIRECTORIO comprobando la actual
  const changeDirectorioPassword = async (user, {actual, nueva}) => {
    if (!user.isDirectorio) {
      return onlyDirectorio;
    }
    const directorio = await repository.findDirectorio();
    if (!directorio || !await verifySecret(actual, directorio.contrasena_hash)) {
      return wrongCurrent;
    }
    await repository.updateDirectorioPassword(directorio.id_directorio, await hashSecret(nueva));
    // Sesión nueva para que el token ya no diga que falta cambiar la contraseña
    return buildSession({...sessionUser(user), cambiarContrasena: false});
  };

  return {login, listLoginUsers, requestPasswordReset, verifyResetCode, confirmPasswordReset, profile, changeDirectorioPassword};
};
