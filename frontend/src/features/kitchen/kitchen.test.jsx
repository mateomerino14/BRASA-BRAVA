import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {mockApi} from '../../test/mockApi';
import {createKitchenBackend} from '../../test/kitchenBackend';
import {setViewport} from '../../test/viewport';
import {removedText, waitTone} from './utils/kitchen';

const openKitchen = async (route = '/cocina') => {
  const backend = createKitchenBackend();
  mockApi(backend.handlers);
  const view = renderApp(route, {token: 't'});
  await screen.findByRole('article', {name: 'Mesa 2, envío 2'});
  return {backend, ...view};
};

const card = (name) => screen.getByRole('article', {name});

describe('Cocina: pedidos pendientes', () => {
  it('muestra los envíos en preparación con espera, avance, consumo y modificaciones', async () => {
    await openKitchen();
    expect(screen.getByRole('heading', {name: 'Pedidos pendientes'})).toBeInTheDocument();
    const summary = screen.getByRole('region', {name: 'Resumen'});
    expect(within(summary).getByText('Unidades por preparar').previousSibling).toHaveTextContent('3');
    const terraza = card('Terraza 1, envío 1');
    expect(within(terraza).getByText('25 min')).toBeInTheDocument();
    expect(within(terraza).getByRole('progressbar', {name: 'Avance de Terraza 1'})).toHaveAttribute('aria-valuenow', '1');
    expect(within(terraza).getByText('1 de 3 listas')).toBeInTheDocument();
    expect(within(terraza).getByText('Sin queso cheddar')).toBeInTheDocument();
    expect(within(terraza).getByText('Para llevar')).toBeInTheDocument();
    const mesa2 = card('Mesa 2, envío 2');
    expect(within(mesa2).getByText('Modificado por a.romero')).toBeInTheDocument();
    expect(within(mesa2).getByText('1 Doble Brava + 1 Gaseosa 500 ml')).toBeInTheDocument();
    const order = screen.getAllByRole('article').map((item) => item.getAttribute('aria-label'));
    expect(order).toEqual(['Terraza 1, envío 1', 'Mesa 2, envío 2']);
  });

  it('suma, resta y marca todas las unidades de una línea', async () => {
    const {user, backend} = await openKitchen();
    const terraza = card('Terraza 1, envío 1');
    await user.click(within(terraza).getByRole('button', {name: 'Sumar una lista de Papas Fritas Clásicas'}));
    expect(await within(terraza).findByLabelText('2 de 2 listas')).toBeInTheDocument();
    expect(within(terraza).getByRole('button', {name: 'Sumar una lista de Papas Fritas Clásicas'})).toBeDisabled();
    await user.click(within(terraza).getByRole('button', {name: 'Restar una lista de Papas Fritas Clásicas'}));
    expect(await within(terraza).findByLabelText('1 de 2 listas')).toBeInTheDocument();
    expect(within(terraza).getByRole('button', {name: 'Restar una lista de Doble Brava'})).toBeDisabled();
    await user.click(within(terraza).getByRole('button', {name: 'Marcar todas listas de Doble Brava'}));
    expect(await within(terraza).findByText('2 de 3 listas')).toBeInTheDocument();
    expect(backend.calls).toEqual([{line: 22, accion: 'sumar'}, {line: 22, accion: 'restar'}, {line: 21, accion: 'todos'}]);
  });

  it('pasa el envío a Listos al terminarlo y lo devuelve a preparación al desmarcar', async () => {
    const {user, location} = await openKitchen();
    await user.click(within(card('Terraza 1, envío 1')).getByRole('button', {name: 'Todo listo'}));
    await waitFor(() => expect(screen.queryByRole('article', {name: 'Terraza 1, envío 1'})).not.toBeInTheDocument());
    const tabs = screen.getByRole('radiogroup', {name: 'Estado de los pedidos'});
    await user.click(within(tabs).getByRole('radio', {name: 'Listos, 1 envío'}));
    expect(location.current.search).toBe('?estado=listos');
    const done = await screen.findByRole('article', {name: 'Terraza 1, envío 1'});
    expect(within(done).getByText('Listo')).toBeInTheDocument();
    await user.click(within(done).getByRole('button', {name: 'Restar una lista de Doble Brava'}));
    await waitFor(() => expect(screen.queryByRole('article', {name: 'Terraza 1, envío 1'})).not.toBeInTheDocument());
    expect(await screen.findByText('Todavía no hay pedidos listos sin cobrar.')).toBeInTheDocument();
  });

  it('vuelve a preparación un envío listo completo', async () => {
    const {user} = await openKitchen();
    await user.click(within(card('Mesa 2, envío 2')).getByRole('button', {name: 'Todo listo'}));
    await user.click(screen.getByRole('radio', {name: 'Listos, 1 envío'}));
    const done = await screen.findByRole('article', {name: 'Mesa 2, envío 2'});
    await user.click(within(done).getByRole('button', {name: 'Volver a preparación'}));
    await waitFor(() => expect(screen.queryByRole('article', {name: 'Mesa 2, envío 2'})).not.toBeInTheDocument());
  });

  it('muestra el error si el pedido ya se cerró', async () => {
    const {user, backend} = await openKitchen();
    backend.control.error = 'La línea no existe o su pedido ya se cerró';
    await user.click(within(card('Mesa 2, envío 2')).getByRole('button', {name: 'Sumar una lista de Combo Brava'}));
    expect(await screen.findByText('La línea no existe o su pedido ya se cerró')).toBeInTheDocument();
  });

  it('se adapta al celular', async () => {
    setViewport(390);
    await openKitchen();
    expect(card('Terraza 1, envío 1')).toBeInTheDocument();
  });

  it('pinta el semáforo de espera y describe lo quitado en combos', () => {
    expect([waitTone(3), waitTone(10), waitTone(25)]).toEqual(['success', 'warning', 'danger']);
    expect(removedText({tipo: 'promocion', exclusiones: [{producto: 'Doble Brava', insumo: 'Queso cheddar'}, {producto: 'Doble Brava', insumo: 'Tomate'}]})).toBe('Doble Brava sin queso cheddar, tomate');
    expect(removedText({tipo: 'producto', exclusiones: []})).toBe('');
  });
});
