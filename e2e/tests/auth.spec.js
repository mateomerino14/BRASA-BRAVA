import {expect, test} from '@playwright/test';
import {loginAs, loginDirectorio} from './helpers.js';

test.describe('Inicio de sesión', () => {
  test('rechaza una contraseña incorrecta', async ({page}) => {
    await page.goto('/login');
    await page.getByRole('button', {name: /admin$/}).first().click();
    await page.getByRole('textbox', {name: 'Contraseña'}).fill('equivocada');
    await page.getByRole('button', {name: 'Ingresar'}).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('el administrador entra, ve todo el menú y cierra sesión', async ({page}) => {
    await loginAs(page, 'admin');
    const menu = page.getByRole('navigation');
    for (const label of ['Home', 'Familia', 'Caja', 'Reportes']) {
      await expect(menu.getByRole('link', {name: label})).toBeVisible();
    }
    await expect(menu.getByRole('button', {name: 'Administración'})).toBeVisible();
    await page.getByRole('button', {name: 'Cerrar sesión'}).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('un cargo sin Caja no ve esa pantalla en el menú', async ({page}) => {
    await loginAs(page, 'r.sanchez');
    const menu = page.getByRole('navigation');
    await expect(menu.getByRole('link', {name: 'Familia'})).toBeVisible();
    await expect(menu.getByRole('link', {name: 'Caja'})).toHaveCount(0);
    await expect(menu.getByRole('link', {name: 'Reportes'})).toHaveCount(0);
  });

  test('el DIRECTORIO entra con su contraseña', async ({page}) => {
    await loginDirectorio(page);
    await expect(page.getByRole('banner').getByText('DIRECTORIO').first()).toBeVisible();
  });
});
