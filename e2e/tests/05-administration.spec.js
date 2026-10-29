import {expect, test} from '@playwright/test';
import {loginAs, menuLink} from '../src/session.js';

test.describe('Administración', () => {
  test('registra una categoría con su subcategoría', async ({page}) => {
    await loginAs(page, 'admin');
    await page.goto('/categorias');
    await page.getByRole('button', {name: /Registrar/}).first().click();
    const form = page.getByRole('dialog', {name: 'Registrar nueva categoría'});
    await form.getByLabel(/^Nombre/).fill('Postres');
    await form.getByRole('textbox', {name: 'Subcategoría 1'}).fill('Helados');
    await form.getByRole('button', {name: 'Registrar'}).click();
    await expect(form).toBeHidden();
    await expect(page.getByRole('row', {name: /Postres/})).toContainText('Helados');
  });

  test('el permiso que se da a un cargo aparece en el menú de sus empleados', async ({page}) => {
    await loginAs(page, 'admin');
    await page.goto('/cargos');
    await page.getByRole('button', {name: 'Modificar Cajero'}).click();
    const form = page.getByRole('dialog', {name: 'Modificar cargo'});
    await form.getByText('Ventas por fechas, en PDF o por correo').click();
    await expect(form.getByRole('checkbox', {name: /^Reportes/})).toBeChecked();
    await form.getByRole('button', {name: 'Guardar'}).click();
    await expect(form).toBeHidden();

    await page.getByRole('button', {name: 'Cerrar sesión'}).click();
    await loginAs(page, 'a.romero');
    await expect(menuLink(page, 'Reportes')).toBeVisible();
  });
});
