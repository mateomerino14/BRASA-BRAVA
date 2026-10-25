import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {USERS, mockApi} from '../../test/mockApi';
import {createDeletionBackend} from '../../test/deletionBackend';

const openDeletion = async (user = USERS.directorio) => {
  const backend = createDeletionBackend();
  mockApi({...backend.handlers, 'GET /auth/me': () => [200, {user}]});
  const view = renderApp('/eliminacion', {token: 't'});
  return {backend, ...view};
};

describe('Eliminación física', () => {
  it('solo el DIRECTORIO la ve en el menú y puede entrar', async () => {
    await openDeletion(USERS.admin);
    expect(await screen.findByRole('heading', {name: 'Página principal'})).toBeInTheDocument();
    expect(screen.queryByRole('link', {name: 'Eliminación física'})).not.toBeInTheDocument();
  });

  it('marca en varias pestañas, muestra lo que arrastra en cascada y borra con la palabra ELIMINAR', async () => {
    const {user, backend} = await openDeletion();
    const table = await screen.findByRole('table', {name: 'Empleados'});
    expect(within(table).getByText('2 ventas se borran también')).toBeInTheDocument();
    await user.click(within(table).getByText('Jorge Quispe'));
    const tabs = screen.getByRole('radiogroup', {name: 'Qué eliminar'});
    await user.click(within(tabs).getByRole('radio', {name: /^Secciones y mesas/}));
    const sections = await screen.findByRole('table', {name: 'Secciones y mesas'});
    await user.click(within(sections).getByLabelText('Marcar Patio'));
    expect(within(tabs).getByRole('radio', {name: /^Empleados/})).toHaveAccessibleName(/^Empleados.*1 marcado$/);
    await user.click(screen.getByRole('button', {name: 'Eliminar 2 marcados'}));

    const dialog = await screen.findByRole('dialog', {name: 'Eliminar para siempre'});
    expect(backend.calls.previews[0]).toMatchObject({empleados: [9], secciones: [4], ventas: []});
    expect(within(dialog).getByText('Patio 1, Patio 2, Patio 3')).toBeInTheDocument();
    expect(within(dialog).getByText(/^2 ventas: Nº 30/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Sí, eliminar'}));
    expect(await within(dialog).findByText('Escriba ELIMINAR para confirmar', {selector: 'p'})).toBeInTheDocument();
    expect(backend.calls.executes).toHaveLength(0);
    await user.type(within(dialog).getByLabelText(/^Escriba ELIMINAR/), 'ELIMINAR');
    await user.click(within(dialog).getByRole('button', {name: 'Sí, eliminar'}));
    expect(await screen.findByText('Se eliminaron 7 registros para siempre')).toBeInTheDocument();
    expect(backend.calls.executes[0]).toMatchObject({empleados: [9], secciones: [4], confirmacion: 'ELIMINAR'});
    expect(await screen.findByText('No hay secciones dadas de baja.')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Eliminar 0 marcados'})).toBeDisabled();
  }, 20000);

  it('avisa lo que impide borrar sin dejar confirmar', async () => {
    const {user, backend} = await openDeletion();
    backend.control.bloqueos = ['Hay 1 pedidos abiertos que dependen de lo elegido (Mesa 2): cóbrelos antes'];
    await user.click(within(await screen.findByRole('table', {name: 'Empleados'})).getByText('Jorge Quispe'));
    await user.click(screen.getByRole('button', {name: 'Eliminar 1 marcado'}));
    const dialog = await screen.findByRole('dialog', {name: 'Eliminar para siempre'});
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('cóbrelos antes');
    expect(within(dialog).queryByRole('button', {name: 'Sí, eliminar'})).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Cerrar'}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('las ventas se eligen por fechas de cobro', async () => {
    const {user, backend} = await openDeletion();
    await screen.findByRole('table', {name: 'Empleados'});
    await user.click(within(screen.getByRole('radiogroup', {name: 'Qué eliminar'})).getByRole('radio', {name: /^Ventas/}));
    const table = await screen.findByRole('table', {name: 'Ventas'});
    expect(within(table).getByText('Mesa 3 · Salón principal')).toBeInTheDocument();
    expect(backend.calls.candidates.at(-1)).toMatchObject({tipo: 'ventas', desde: expect.any(String), hasta: expect.any(String)});
    await user.click(screen.getByRole('button', {name: 'Marcar todos'}));
    expect(screen.getByText('2 de 2 marcados')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Quitar marcas'}));
    expect(screen.getByText('0 de 2 marcados')).toBeInTheDocument();
  });
});
