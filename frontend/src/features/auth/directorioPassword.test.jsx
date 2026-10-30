import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {USERS, mockApi} from '../../test/mockApi';

const openAs = async (user, handlers = {}) => {
  const calls = [];
  mockApi({
    'GET /auth/me': () => [200, {user}],
    'PUT /auth/directorio/password': (body) => {
      calls.push(body);
      if (body.actual !== 'Directorio2026') {
        return [400, {message: 'La contraseña actual no es correcta', campo: 'actual'}];
      }
      return [200, {message: 'Contraseña del DIRECTORIO actualizada'}];
    },
    ...handlers,
  });
  const view = renderApp('/', {token: 't'});
  await screen.findByRole('heading', {name: 'Página principal'});
  return {calls, ...view};
};

const fill = async (user, dialog, label, value) => {
  const input = within(dialog).getByLabelText(new RegExp(`^${label}`));
  await user.clear(input);
  await user.type(input, value);
};

describe('Contraseña del DIRECTORIO', () => {
  it('solo el DIRECTORIO ve el botón de cambiar contraseña', async () => {
    await openAs(USERS.admin);
    expect(screen.queryByRole('button', {name: 'Cambiar contraseña'})).not.toBeInTheDocument();
  });

  it('valida, marca la actual equivocada en su campo y cambia la contraseña', async () => {
    const {calls, user} = await openAs(USERS.directorio);
    await user.click(screen.getByRole('button', {name: 'Cambiar contraseña'}));
    const dialog = await screen.findByRole('dialog', {name: 'Cambiar contraseña'});
    await user.click(within(dialog).getByRole('button', {name: 'Cambiar contraseña'}));
    expect(within(dialog).getByText('Ingrese la contraseña actual')).toBeInTheDocument();
    expect(within(dialog).getByText('Repita la nueva contraseña', {selector: 'p'})).toBeInTheDocument();

    await fill(user, dialog, 'Contraseña actual', 'Otra2026');
    await fill(user, dialog, 'Nueva contraseña', 'Nueva2027');
    await fill(user, dialog, 'Repita la nueva contraseña', 'Nueva2028');
    await user.click(within(dialog).getByRole('button', {name: 'Cambiar contraseña'}));
    expect(within(dialog).getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(calls).toHaveLength(0);

    await fill(user, dialog, 'Repita la nueva contraseña', 'Nueva2027');
    await user.click(within(dialog).getByRole('button', {name: 'Cambiar contraseña'}));
    expect(await within(dialog).findByText('La contraseña actual no es correcta')).toBeInTheDocument();

    await fill(user, dialog, 'Contraseña actual', 'Directorio2026');
    await user.click(within(dialog).getByRole('button', {name: 'Cambiar contraseña'}));
    expect(await screen.findByText(/Se cambió la contraseña del DIRECTORIO/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(calls.at(-1)).toEqual({actual: 'Directorio2026', nueva: 'Nueva2027', confirmacion: 'Nueva2027'});
  });

  it('con la contraseña inicial obliga a cambiarla antes de usar el sistema', async () => {
    const pending = {...USERS.directorio, cambiarContrasena: true};
    const {calls, user} = await openAs(pending, {
      'PUT /auth/directorio/password': (body) => {
        calls.push(body);
        return [200, {message: 'ok', token: 'nuevo', user: {...USERS.directorio, cambiarContrasena: false}}];
      },
    });
    const dialog = await screen.findByRole('dialog', {name: 'Elija su contraseña'});
    expect(within(dialog).queryByRole('button', {name: 'Cancelar'})).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', {name: 'Elija su contraseña'})).toBeInTheDocument();

    await fill(user, dialog, 'Contraseña actual', 'Directorio2026');
    await fill(user, dialog, 'Nueva contraseña', 'Propia2027');
    await fill(user, dialog, 'Repita la nueva contraseña', 'Propia2027');
    await user.click(within(dialog).getByRole('button', {name: 'Cambiar contraseña'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(localStorage.getItem('brasa.token')).toBe('nuevo');
  });

  it('con la contraseña inicial deja cerrar sesión', async () => {
    const {user} = await openAs({...USERS.directorio, cambiarContrasena: true});
    const dialog = await screen.findByRole('dialog', {name: 'Elija su contraseña'});
    await user.click(within(dialog).getByRole('button', {name: 'Cerrar sesión'}));
    expect(await screen.findByRole('heading', {name: 'Inicio de sesión'})).toBeInTheDocument();
  });
});
