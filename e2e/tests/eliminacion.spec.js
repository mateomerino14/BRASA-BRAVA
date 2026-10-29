import {expect, test} from '@playwright/test';
import {loginAs, loginDirectorio} from './helpers.js';

test.describe('Eliminación física', () => {
  test('el DIRECTORIO borra para siempre un empleado dado de baja', async ({page}) => {
    await loginDirectorio(page);
    await page.goto('/eliminacion');
    const row = page.getByRole('row', {name: /Javier Ortiz/});
    await row.click();
    await page.getByRole('button', {name: /^Eliminar 1 marcad/}).click();

    const confirm = page.getByRole('dialog', {name: 'Eliminar para siempre'});
    await expect(confirm).toContainText('Empleados: Javier Ortiz');
    await confirm.getByRole('textbox', {name: /Escriba ELIMINAR/}).fill('ELIMINAR');
    await confirm.getByRole('button', {name: 'Sí, eliminar'}).click();
    await expect(confirm).toBeHidden();
    await expect(row).toHaveCount(0);
  });

  test('un empleado no ve la pantalla de eliminación', async ({page}) => {
    await loginAs(page, 'admin');
    await expect(page.getByRole('navigation').getByRole('link', {name: 'Eliminación física'})).toHaveCount(0);
  });
});
