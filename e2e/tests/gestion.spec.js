import {expect, test} from '@playwright/test';
import {loginAs} from './helpers.js';

test.describe('Gestión', () => {
  test('registra una categoría con su subcategoría', async ({page}) => {
    await loginAs(page, 'admin');
    await page.goto('/categorias');
    await page.getByRole('button', {name: /Registrar/}).first().click();
    const form = page.getByRole('dialog', {name: 'Registrar nueva categoría'});
    await form.getByRole('textbox', {name: /Nombre/}).fill('Postres');
    await form.getByRole('textbox', {name: 'Subcategoría 1'}).fill('Helados');
    await form.getByRole('button', {name: 'Registrar'}).click();
    await expect(form).toBeHidden();
    await expect(page.getByRole('row', {name: /Postres/})).toContainText('Helados');
  });

  test('Familia muestra el catálogo del local', async ({page}) => {
    await loginAs(page, 'c.mendoza');
    await page.goto('/familia');
    await expect(page.getByText('Hamburguesa Clásica').first()).toBeVisible();
  });

  test('el administrador da acceso a Reportes al cargo Cajero', async ({page}) => {
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
    await expect(page.getByRole('navigation').getByRole('link', {name: 'Reportes'})).toBeVisible();
  });
});
