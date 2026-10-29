import {expect, test} from '@playwright/test';
import {demoPassword, loginAs, printCount, stubPrint} from './helpers.js';

const ticketLimit = 3;

test.describe('Caja', () => {
  test('arma un pedido, lo envía a cocina, lo marca listo y lo cobra', async ({page}) => {
    await stubPrint(page);
    await loginAs(page, 'admin');
    await page.goto('/caja');

    await page.getByRole('button', {name: 'Mesa 3, libre'}).click();
    await page.getByRole('button', {name: 'Gaseosa 500 ml, Bs 10,00'}).click();
    const picker = page.getByRole('dialog', {name: 'Gaseosa 500 ml'});
    await picker.getByRole('button', {name: 'Sumar cantidad de Gaseosa 500 ml'}).click();
    await picker.getByRole('radio', {name: 'Para llevar'}).click();
    await picker.getByRole('button', {name: 'Agregar al pedido'}).click();

    const order = page.getByRole('region', {name: 'Pedido de la mesa'});
    await expect(order.getByRole('list', {name: 'Productos por registrar'})).toContainText('Gaseosa 500 ml');
    await expect(order).toContainText('20,00');

    await order.getByRole('button', {name: 'Enviar a cocina'}).click();
    const comanda = page.getByRole('dialog', {name: 'Comanda de cocina'});
    await expect(comanda).toContainText('Envío 1');
    await expect(comanda).toContainText('LL');
    await comanda.getByRole('button', {name: 'Cerrar'}).click();

    await expect(page.getByRole('button', {name: 'Cobrar', exact: true})).toBeDisabled();
    await page.getByRole('button', {name: 'Marcar listos'}).click();
    const ready = page.getByRole('dialog', {name: 'Marcar listos · Mesa 3'});
    await ready.getByRole('button', {name: 'Todo listo'}).click();
    await expect(ready).toContainText('Ya salió todo');
    await ready.getByRole('button', {name: 'Cerrar'}).click();

    await page.getByRole('button', {name: 'Cobrar', exact: true}).click();
    const checkout = page.getByRole('dialog', {name: 'Cobrar Mesa 3'});
    await checkout.getByRole('button', {name: 'Bs 50,00'}).click();
    await checkout.getByRole('button', {name: 'Cobrar Bs 20,00'}).click();

    const ticket = page.getByRole('dialog', {name: 'Ticket de venta'});
    await expect(ticket).toContainText('Mesa 3 quedó libre');
    await expect(ticket).toContainText(/Cambio\s*Bs 30,00/);
    await expect.poll(() => printCount(page)).toBe(1);

    for (let print = 2; print <= ticketLimit; print += 1) {
      await ticket.getByRole('button', {name: 'Imprimir', exact: true}).click();
      await expect.poll(() => printCount(page)).toBe(print);
    }

    await ticket.getByRole('button', {name: 'Imprimir', exact: true}).click();
    const authorization = page.getByRole('dialog', {name: `Ticket ya impreso ${ticketLimit} veces`});
    await authorization.getByRole('textbox', {name: /Usuario de quien autoriza/}).fill('a.romero');
    await authorization.getByRole('textbox', {name: /Contraseña/}).fill(demoPassword);
    await authorization.getByRole('button', {name: 'Autorizar e imprimir'}).click();
    await expect.poll(() => printCount(page)).toBe(ticketLimit + 1);

    await page.getByRole('dialog', {name: 'Ticket de venta'}).getByRole('button', {name: 'Cerrar'}).click();
    await expect(page.getByRole('button', {name: 'Mesa 3, libre'})).toBeVisible();
  });

  test('Ventas de hoy muestra la venta cobrada', async ({page}) => {
    await stubPrint(page);
    await loginAs(page, 'admin');
    await page.goto('/caja');
    await page.getByRole('button', {name: 'Ventas de hoy'}).click();
    const sales = page.getByRole('dialog').last();
    await expect(sales).toContainText('Mesa 3');
  });
});
