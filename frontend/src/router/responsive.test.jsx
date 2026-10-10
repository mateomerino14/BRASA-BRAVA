import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../test/renderApp';
import {mockApi} from '../test/mockApi';
import {setViewport} from '../test/viewport';
import {createEmployeesBackend} from '../test/employeesBackend';

const PHONE_WIDTH = 390;
const TABLET_WIDTH = 820;

const openApp = async (route = '/') => {
  const backend = createEmployeesBackend();
  mockApi(backend.handlers);
  const view = renderApp(route, {token: 't'});
  await screen.findByRole('heading', {level: 1});
  return view;
};

describe('Interfaz adaptable', () => {
  it('en escritorio muestra el menú fijo y no el botón de menú', async () => {
    await openApp();
    expect(screen.getByRole('complementary', {name: 'Menú principal'})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Abrir menú'})).not.toBeInTheDocument();
  });

  it('en celular el menú se abre con el botón y se cierra al navegar', async () => {
    setViewport(PHONE_WIDTH);
    const {user} = await openApp();
    expect(screen.queryByRole('complementary', {name: 'Menú principal'})).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', {name: 'Abrir menú'});
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    const drawer = await screen.findByRole('dialog', {name: 'Menú de navegación'});
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(drawer).getByRole('link', {name: 'Home'})).toHaveFocus();
    await user.click(within(drawer).getByRole('button', {name: 'Administración'}));
    await user.click(await within(drawer).findByRole('link', {name: 'Empleados'}));

    expect(await screen.findByRole('heading', {name: 'Gestión de empleados'})).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog', {name: 'Menú de navegación'})).not.toBeInTheDocument());
  });

  it('el menú de celular se cierra con Escape, con la X y devuelve el foco', async () => {
    setViewport(PHONE_WIDTH);
    const {user} = await openApp();
    const toggle = screen.getByRole('button', {name: 'Abrir menú'});
    await user.click(toggle);
    await screen.findByRole('dialog', {name: 'Menú de navegación'});
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', {name: 'Menú de navegación'})).not.toBeInTheDocument());
    expect(toggle).toHaveFocus();

    await user.click(toggle);
    await user.click(await screen.findByRole('button', {name: 'Cerrar menú'}));
    await waitFor(() => expect(screen.queryByRole('dialog', {name: 'Menú de navegación'})).not.toBeInTheDocument());
  });

  it('en celular la sesión se cierra desde el menú', async () => {
    setViewport(PHONE_WIDTH);
    const {user} = await openApp();
    await user.click(screen.getByRole('button', {name: 'Abrir menú'}));
    const drawer = await screen.findByRole('dialog', {name: 'Menú de navegación'});
    expect(within(drawer).getByText('Administrador')).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', {name: 'Cerrar sesión'}));
    expect(await screen.findByRole('heading', {name: 'Inicio de sesión'})).toBeInTheDocument();
  });

  it('en celular y tablet la tabla se muestra como tarjetas con sus acciones', async () => {
    setViewport(TABLET_WIDTH);
    const {user} = await openApp('/empleados');
    const cards = await screen.findByRole('list', {name: 'Empleados'});
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    const andrea = within(cards).getAllByRole('listitem')[0];
    expect(within(andrea).getByText('Andrea Romero')).toBeInTheDocument();
    expect(within(andrea).getByText('CI')).toBeInTheDocument();
    expect(within(andrea).getByText('6812903 LP')).toBeInTheDocument();
    await user.click(within(andrea).getByRole('button', {name: 'Modificar a Andrea Romero'}));
    expect(await screen.findByRole('dialog', {name: 'Modificar empleado'})).toBeInTheDocument();
  });
});
