import {describe, expect, it} from 'vitest';
import {authorize} from '../src/middlewares/auth.js';
import {generateCode} from '../src/utils/code.js';
import {normalizePermissions} from '../src/modules/auth/permissions.js';
import {resetCodeEmail} from '../src/modules/auth/resetCodeEmail.js';

describe('autorización', () => {
  // Ejecuta el middleware con el usuario dado y devuelve el error (si hubo)
  const run = (user, permission) => {
    let result;
    authorize(permission)({user}, {}, (error) => {
      result = error;
    });
    return result;
  };

  it('deja pasar con el permiso o al DIRECTORIO', () => {
    expect(run({permissions: ['caja']}, 'caja')).toBeUndefined();
    expect(run({isDirectorio: true, permissions: []}, 'empleados')).toBeUndefined();
  });

  it('responde 403 sin el permiso', () => {
    expect(run({permissions: ['caja']}, 'empleados')).toMatchObject({status: 403});
  });
});

describe('utilidades', () => {
  it('genera códigos de exactamente 6 dígitos', () => {
    for (let index = 0; index < 200; index += 1) {
      expect(generateCode()).toMatch(/^\d{6}$/);
    }
  });

  it('normaliza permisos: descarta desconocidos y siempre incluye home', () => {
    expect(normalizePermissions(['caja', 'hackear'])).toEqual(['home', 'caja']);
  });

  it('escapa el nombre en el correo para evitar HTML inyectado', () => {
    const html = resetCodeEmail({name: '<script>x</script>', code: '123456', minutes: 10});
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
