import {expect, test} from '@playwright/test';
import {loginAs, printCalls, stubPrinting} from '../src/session.js';
import {addItem, closeKitchenTicket, menu, orderPanel, tableButton} from '../src/cashier.js';

test.describe('Caja de punta a punta', () => {
  test.beforeEach(async ({page}) => {
    await stubPrinting(page);
  });

  test('abre una mesa, suma un envío de otro cajero, marca listos y cobra con cambio', async ({page}) => {
    await loginAs(page, 'a.romero');
    await page.goto('/caja');
    await expect(menu(page)).toBeVisible();
    await tableButton(page, 'Mesa 3').click();
    await expect(orderPanel(page).getByRole('heading', {name: 'Mesa 3'})).toBeVisible();
    await expect(orderPanel(page).getByLabel(/^Mesero/)).toHaveCount(0);

    await addItem(page, 'Hamburguesa Clásica', {times: 1, remove: ['Lechuga']});
    await addItem(page, 'Gaseosa 500 ml', {llevar: true});
    const pending = orderPanel(page).getByRole('list', {name: 'Productos por registrar'});
    await expect(pending.getByRole('listitem')).toHaveCount(2);
    await expect(pending).toContainText('Sin lechuga');
    await expect(orderPanel(page).getByLabel('Bs 80,00')).toBeVisible();

    await orderPanel(page).getByRole('button', {name: 'Enviar a cocina'}).click();
    await expect(page.getByText(/^Se abrió Mesa 3 con el pedido Nº \d+ y se envió a cocina$/)).toBeVisible();
    const kitchen = page.getByRole('dialog', {name: 'Comanda de cocina'});
    const firstTicket = kitchen.getByRole('article', {name: 'Comanda del envío 1'});
    await expect(firstTicket).toContainText('Cajero: a.romero');
    await expect(firstTicket).toContainText('sin: lechuga');
    await expect(firstTicket).not.toContainText('Mesero');
    await kitchen.getByRole('button', {name: 'Imprimir'}).click();
    expect(await printCalls(page)).toBe(1);
    await closeKitchenTicket(page, 1);
    await expect(tableButton(page, 'Mesa 3')).not.toHaveAccessibleName(/libre/);

    await page.getByRole('button', {name: 'Cerrar sesión'}).click();
    await loginAs(page, 'admin');
    await page.goto('/caja');
    await tableButton(page, 'Mesa 3').click();
    await expect(orderPanel(page).getByText(/^Envío 1 · \d{1,2}:\d{2} (AM|PM) · Registró: a\.romero$/)).toBeVisible();
    await addItem(page, 'Aros de Cebolla');
    await orderPanel(page).getByRole('button', {name: 'Enviar a cocina'}).click();
    await expect(page.getByText(/^Se envió a cocina el envío 2 del pedido Nº \d+$/)).toBeVisible();
    const secondTicket = page.getByRole('dialog', {name: 'Comanda de cocina'}).getByRole('article', {name: 'Comanda del envío 2'});
    await expect(secondTicket).toContainText('MODIFICADO POR: ADMIN');
    await closeKitchenTicket(page, 2);
    await expect(orderPanel(page).getByText(/^Envío 2 · .* · Registró: admin$/)).toBeVisible();
    await expect(orderPanel(page).getByText('Modificado por admin')).toBeVisible();

    await expect(orderPanel(page).getByRole('button', {name: 'Cobrar'})).toBeDisabled();
    await orderPanel(page).getByRole('button', {name: 'Marcar listos'}).click();
    const ready = page.getByRole('dialog', {name: 'Marcar listos · Mesa 3'});
    await expect(ready.getByRole('region', {name: 'Para llevar'})).toContainText('Gaseosa 500 ml');
    await ready.getByRole('button', {name: 'Todo listo'}).click();
    await expect(page.getByText('Todo listo en Mesa 3. Ya se puede cobrar')).toBeVisible();
    await expect(ready.getByRole('region', {name: 'Faltan'})).toContainText('Ya salió todo. Se puede cobrar.');
    await ready.getByRole('button', {name: 'Cerrar'}).click();
    await expect(ready).toBeHidden();

    await orderPanel(page).getByRole('button', {name: 'Cobrar'}).click();
    const checkout = page.getByRole('dialog', {name: 'Cobrar Mesa 3'});
    await expect(checkout.getByRole('region', {name: 'Vista previa del ticket'})).toBeVisible();
    await checkout.getByLabel('Efectivo recibido').fill('50');
    await checkout.getByRole('button', {name: 'Cobrar Bs 98,00'}).click();
    await expect(checkout.getByText('No alcanza: faltan Bs 48,00')).toBeVisible();
    await checkout.getByLabel('Efectivo recibido').fill('100');
    await expect(checkout.getByLabel('Bs 2,00')).toBeVisible();
    await checkout.getByRole('button', {name: 'Cobrar Bs 98,00'}).click();

    const receipt = page.getByRole('dialog', {name: 'Ticket de venta'});
    await expect(receipt.getByRole('article', {name: /^Ticket del pedido \d+$/})).toBeVisible();
    await receipt.getByRole('button', {name: 'Cerrar'}).click();
    await expect(tableButton(page, 'Mesa 3')).toHaveAccessibleName('Mesa 3, libre');

    await page.getByRole('button', {name: 'Ventas de hoy'}).click();
    const today = page.getByRole('dialog', {name: 'Ventas de hoy'});
    await expect(today.getByText(/^Nº \d+ · Mesa 3$/)).toBeVisible();
  });

  test('no deja cobrar mientras falta algo de cocina y avisa al cambiar de mesa', async ({page}) => {
    await loginAs(page, 'admin');
    await page.goto('/caja');
    await tableButton(page, 'Mesa 4').click();
    await addItem(page, 'Jugo de Naranja');
    await tableButton(page, 'Mesa 5').click();
    const discard = page.getByRole('dialog', {name: 'Descartar productos'});
    await discard.getByRole('button', {name: 'Cancelar'}).click();
    await expect(page).toHaveURL(/mesa=/);
    await expect(orderPanel(page).getByRole('heading', {name: 'Mesa 4'})).toBeVisible();

    await orderPanel(page).getByRole('button', {name: 'Enviar a cocina'}).click();
    await closeKitchenTicket(page, 1);
    await expect(orderPanel(page).getByRole('button', {name: 'Cobrar'})).toBeDisabled();
    await expect(orderPanel(page).getByText('0 de 1 listos')).toBeVisible();
  });
});
