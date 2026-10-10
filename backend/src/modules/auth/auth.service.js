import {generateCode} from '../../utils/code.js';
import {DUMMY_HASH, hashSecret, verifySecret} from '../../utils/password.js';
import {signToken} from '../../utils/token.js';
import {SCREENS, normalizePermissions} from './permissions.js';
import {resetCodeEmail} from './resetCodeEmail.js';

const directorioUsername = 'DIRECTORIO';
const invalidCredentials = 'Usuario o contraseña incorrectos';
const invalidCode = 'El código es inválido o ya expiró';
const lockedCode = 'Código bloqueado por demasiados intentos. Solicite uno nuevo';
const msPerMinute = 60_000;

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
      permissions: [...SCREENS],
    });
  };

  // Autentica a un empleado activo y carga los permisos de su cargo
  const loginEmployee = async (alias, password) => {
    const employee = await repository.findActiveEmployeeByAlias(alias);
    // Se compara contra un hash de relleno para no revelar por el tiempo si el usuario existe
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

  // Genera y envía un código si el correo existe; responde igual en ambos casos
  const requestPasswordReset = async ({email}) => {
    const employee = await repository.findActiveEmployeeByEmail(email);
    if (!employee) {
      return {sent: false};
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
    return {sent: true};
  };

  // Arma el mensaje de error según los intentos que le quedan al código
  const failedAttemptMessage = (record) => {
    const remaining = config.RESET_CODE_MAX_ATTEMPTS - record.intentos - 1;
    if (remaining > 0) {
      return `Código incorrecto. Le quedan ${remaining} intento(s)`;
    }
    return lockedCode;
  };

  // Comprueba el código vigente y cuenta los intentos fallidos
  const checkCode = async ({email, code}) => {
    const employee = await repository.findActiveEmployeeByEmail(email);
    if (!employee) {
      return {error: invalidCode, status: 400};
    }
    const record = await repository.findLatestActiveCode(employee.id_empleado);
    if (!record || new Date(record.expira_en) <= now()) {
      return {error: invalidCode, status: 400};
    }
    const valid = await verifySecret(code, record.codigo_hash);
    if (!valid) {
      await repository.registerFailedAttempt(record.id_codigo, config.RESET_CODE_MAX_ATTEMPTS);
      return {error: failedAttemptMessage(record), status: 400};
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

  // Perfil de la sesión con el nombre y la foto actuales del empleado (el resto viene del token)
  const profile = async (user) => {
    if (user.isDirectorio) {
      return user;
    }
    const row = await repository.findProfile(user.id);
    if (!row) {
      return user;
    }
    return {...user, nombre: `${row.nombre} ${row.apellido}`, fotoUrl: row.foto_url};
  };

  return {login, listLoginUsers, requestPasswordReset, verifyResetCode, confirmPasswordReset, profile};
};
