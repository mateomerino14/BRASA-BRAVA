import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {mockApi} from '../../test/mockApi';
import {passwordError} from './hooks/usePasswordReset';

describe('Login', () => {
  it('sin sesión, cualquier ruta protegida lleva al login', async () => {
    mockApi();
    renderApp('/stock');
    expect(await screen.findByRole('heading', {name: 'Inicio de sesión'})).toBeInTheDocument();
  });

  it('valida campos vacíos sin llamar a la API', async () => {
    const fetchMock = mockApi();
    const {user} = renderApp('/login');
    await user.click(await screen.findByRole('button', {name: 'Ingresar'}));
    expect(screen.getByText('Ingrese su usuario')).toBeInTheDocument();
    expect(screen.getByText('Ingrese su contraseña')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/auth/login'))).toBe(false);
  });

  it('muestra el error del servidor y limpia la contraseña', async () => {
    mockApi();
    const {user} = renderApp('/login');
    await user.type(await screen.findByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), 'mala');
    await user.click(screen.getByRole('button', {name: 'Ingresar'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
  });

  it('elegir un empleado del carrusel completa el usuario e inicia sesión', async () => {
    mockApi();
    const {user} = renderApp('/login');
    await user.click(await screen.findByRole('button', {name: /a\.romero/}));
    expect(screen.getByLabelText('Usuario')).toHaveValue('a.romero');
    expect(screen.getByLabelText('Contraseña')).toHaveFocus();
    await user.keyboard('Brasa2026{Enter}');
    expect(await screen.findByRole('heading', {name: 'Página principal'})).toBeInTheDocument();
    expect(localStorage.getItem('brasa.token')).toBe('token-de-prueba');
  });

  it('modo DIRECTORIO fija el usuario y se puede revertir', async () => {
    mockApi();
    const {user} = renderApp('/login');
    await user.click(await screen.findByRole('button', {name: 'Modo directorio'}));
    expect(screen.getByLabelText('Usuario')).toHaveValue('DIRECTORIO');
    expect(screen.getByText(/Modo DIRECTORIO/)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {name: '¿Olvidaste tu contraseña?'}),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Modo empleado'}));
    expect(screen.getByLabelText('Usuario')).toHaveValue('');
  });

  it('restaura la sesión guardada y vuelve a la ruta pedida', async () => {
    mockApi();
    renderApp('/stock', {token: 'guardado'});
    expect(await screen.findByRole('heading', {name: 'Gestión de stock'})).toBeInTheDocument();
  });

  it('un token vencido cierra la sesión', async () => {
    mockApi({'GET /auth/me': () => [401, {message: 'Sesión inválida o expirada'}]});
    renderApp('/', {token: 'vencido'});
    expect(await screen.findByRole('heading', {name: 'Inicio de sesión'})).toBeInTheDocument();
    expect(localStorage.getItem('brasa.token')).toBeNull();
  });
});

describe('Recuperación de contraseña', () => {
  const openReset = async (user) => {
    await user.click(await screen.findByRole('button', {name: '¿Olvidaste tu contraseña?'}));
    return screen.findByRole('dialog', {name: 'Recuperar contraseña'});
  };

  it('recorre correo → código → nueva contraseña → listo', async () => {
    const fetchMock = mockApi({
      'POST /auth/password-reset/request': () => [200, {message: 'ok'}],
      'POST /auth/password-reset/verify': ({code}) =>
        code === '123456'
          ? [200, {}]
          : [400, {message: 'Código incorrecto. Le quedan 4 intento(s)'}],
      'POST /auth/password-reset/confirm': () => [200, {}],
    });
    const {user} = renderApp('/login');
    const dialog = await openReset(user);

    await user.type(within(dialog).getByLabelText('Correo'), 'c.mendoza@brasabrava.bo');
    await user.click(within(dialog).getByRole('button', {name: 'Enviar código'}));
    const codeDialog = await screen.findByRole('dialog', {name: 'Verificación de identidad'});

    await user.click(await within(codeDialog).findByLabelText('Dígito 1'));
    await user.paste('999999');
    await user.click(within(codeDialog).getByRole('button', {name: 'Verificar'}));
    expect(await within(codeDialog).findByRole('alert')).toHaveTextContent('Le quedan 4');

    await user.click(within(codeDialog).getByLabelText('Dígito 1'));
    await user.paste('123456');
    await user.click(within(codeDialog).getByRole('button', {name: 'Verificar'}));
    const passDialog = await screen.findByRole('dialog', {name: 'Nueva contraseña'});

    await user.type(await within(passDialog).findByLabelText('Nueva contraseña'), 'NuevaClave99');
    await user.type(within(passDialog).getByLabelText('Confirmar contraseña'), 'Distinta99');
    await user.click(within(passDialog).getByRole('button', {name: 'Guardar contraseña'}));
    expect(await within(passDialog).findByRole('alert')).toHaveTextContent('no coinciden');

    await user.clear(within(passDialog).getByLabelText('Confirmar contraseña'));
    await user.type(within(passDialog).getByLabelText('Confirmar contraseña'), 'NuevaClave99');
    await user.click(within(passDialog).getByRole('button', {name: 'Guardar contraseña'}));
    expect(
      await screen.findByRole('dialog', {name: 'Contraseña actualizada'}),
    ).toBeInTheDocument();

    const confirmCall = fetchMock.mock.calls.find(([url]) => url.endsWith('/confirm'));
    expect(JSON.parse(confirmCall[1].body)).toEqual({
      email: 'c.mendoza@brasabrava.bo',
      code: '123456',
      newPassword: 'NuevaClave99',
    });
  });

  it('valida el correo antes de enviarlo', async () => {
    const fetchMock = mockApi();
    const {user} = renderApp('/login');
    const dialog = await openReset(user);
    await user.type(within(dialog).getByLabelText('Correo'), 'no-es-correo');
    await user.click(within(dialog).getByRole('button', {name: 'Enviar código'}));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Ingrese un correo válido');
    expect(fetchMock.mock.calls.some(([url]) => url.includes('password-reset'))).toBe(false);
  });

  it('pide completar los 6 dígitos y se cancela', async () => {
    mockApi({'POST /auth/password-reset/request': () => [200, {}]});
    const {user} = renderApp('/login');
    const dialog = await openReset(user);
    await user.type(within(dialog).getByLabelText('Correo'), 'c.mendoza@brasabrava.bo');
    await user.click(within(dialog).getByRole('button', {name: 'Enviar código'}));
    const codeDialog = await screen.findByRole('dialog', {name: 'Verificación de identidad'});
    await within(codeDialog).findByLabelText('Dígito 1');
    await user.click(within(codeDialog).getByRole('button', {name: 'Verificar'}));
    expect(await within(codeDialog).findByRole('alert')).toHaveTextContent(
      'Complete los 6 dígitos',
    );
    await user.click(within(codeDialog).getByRole('button', {name: 'Cancelar'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('las reglas de contraseña coinciden con el backend', () => {
    expect(passwordError('corta1')).toMatch(/8 caracteres/);
    expect(passwordError('12345678')).toMatch(/letras/);
    expect(passwordError('soloLetras')).toMatch(/números/);
    expect(passwordError('Valida123')).toBe('');
  });
});
