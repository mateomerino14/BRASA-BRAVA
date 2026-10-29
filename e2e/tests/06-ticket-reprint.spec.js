import {expect, test} from '@playwright/test';
import {DEMO_PASSWORD, loginAs, printCalls, stubPrinting} from '../src/session.js';
import {addItem, closeKitchenTicket, orderPanel, tableButton} from '../src/cashier.js';

const TICKET_PRINT_LIMIT = 3;

test.describe('Reimpresión del ticket', () => {
  test.beforeEach(async ({page}) => {
    await stubPrinting(page);
  });

  test('desde la 4.ª impresión del ticket pide la autorización de un empleado con Caja', async ({page}) => {
    await loginAs(page, 'admin');
    await page.goto('/caja');
    await tableButton(page, 'Mesa 6').click();
    await addItem(page, 'Gaseosa 500 ml');
    await orderPanel(page).getByRole('button', {name: 'Enviar a cocina'}).click();
    await closeKitchenTicket(page, 1);
    await orderPanel(page).getByRole('button', {name: 'Marcar listos'}).click();
    const ready = page.getByRole('dialog', {name: 'Marcar listos · Mesa 6'});
    await ready.getByRole('button', {name: 'Todo listo'}).click();
    await ready.getByRole('button', {name: 'Cerrar'}).click();

    await orderPanel(page).getByRole('button', {name: 'Cobrar'}).click();
    await page.getByRole('dialog', {name: 'Cobrar Mesa 6'}).getByRole('button', {name: 'Cobrar Bs 10,00'}).click();
    const receipt = page.getByRole('dialog', {name: 'Ticket de venta'});
    await expect.poll(() => printCalls(page)).toBe(1);
    for (let print = 2; print <= TICKET_PRINT_LIMIT; print += 1) {
      await receipt.getByRole('button', {name: 'Imprimir', exact: true}).click();
      await expect.poll(() => printCalls(page)).toBe(print);
    }

    await receipt.getByRole('button', {name: 'Imprimir', exact: true}).click();
    const authorization = page.getByRole('dialog', {name: `Ticket ya impreso ${TICKET_PRINT_LIMIT} veces`});
    await expect(authorization.getByRole('list', {name: 'Impresiones anteriores'}).getByRole('listitem')).toHaveCount(TICKET_PRINT_LIMIT);
    await authorization.getByLabel(/^Usuario de quien autoriza/).fill('a.romero');
    await authorization.getByLabel(/^Contraseña/).fill('equivocada');
    await authorization.getByRole('button', {name: 'Autorizar e imprimir'}).click();
    await expect(authorization.getByRole('alert')).toBeVisible();
    expect(await printCalls(page)).toBe(TICKET_PRINT_LIMIT);

    await authorization.getByLabel(/^Contraseña/).fill(DEMO_PASSWORD);
    await authorization.getByRole('button', {name: 'Autorizar e imprimir'}).click();
    await expect(authorization).toBeHidden();
    await expect.poll(() => printCalls(page)).toBe(TICKET_PRINT_LIMIT + 1);
  });
});
