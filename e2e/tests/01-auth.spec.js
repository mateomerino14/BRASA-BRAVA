import {expect, test} from '@playwright/test';
import {DEMO_PASSWORD, loginAs, loginAsDirectorio, menuLink} from '../src/session.js';

test.describe('Inicio de sesión', () => {
  test('rechaza una contraseña incorrecta y deja entrar con la correcta', async ({page}) => {
    await page.goto('/');
    await expect(page.getByRole('heading', {name: 'Inicio de sesión'})).toBeVisible();
    await page.getByLabel('Usuario', {exact: true}).fill('admin');
    await page.getByLabel('Contraseña', {exact: true}).fill('equivocada');
    await page.getByRole('button', {name: 'Ingresar'}).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Contraseña', {exact: true})).toHaveValue('');

    await page.getByLabel('Contraseña', {exact: true}).fill(DEMO_PASSWORD);
    await page.getByRole('button', {name: 'Ingresar'}).click();
    await expect(page.getByRole('heading', {name: 'Página principal'})).toBeVisible();
    await expect(menuLink(page, 'Reportes')).toBeVisible();
  });

  test('un empleado dado de baja no puede ingresar', async ({page}) => {
    await page.goto('/login');
    await page.getByLabel('Usuario', {exact: true}).fill('j.ortiz');
    await page.getByLabel('Contraseña', {exact: true}).fill(DEMO_PASSWORD);
    await page.getByRole('button', {name: 'Ingresar'}).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Inicio de sesión'})).toBeVisible();
  });

  test('cada cargo ve solo sus pantallas y la sesión se cierra', async ({page}) => {
    await loginAs(page, 'r.sanchez');
    await expect(page.getByRole('heading', {name: 'Página principal'})).toBeVisible();
    await expect(menuLink(page, 'Familia')).toBeVisible();
    await expect(menuLink(page, 'Caja')).toHaveCount(0);
    await expect(menuLink(page, 'Reportes')).toHaveCount(0);
    await page.goto('/reportes');
    await expect(page.getByRole('heading', {name: 'Reportes'})).toHaveCount(0);

    await page.getByRole('button', {name: 'Cerrar sesión'}).click();
    await expect(page.getByRole('heading', {name: 'Inicio de sesión'})).toBeVisible();
  });

  test('el DIRECTORIO entra con su botón y ve la eliminación física', async ({page}) => {
    await loginAsDirectorio(page);
    await page.getByRole('navigation').getByRole('button', {name: 'Administración'}).click();
    await expect(menuLink(page, 'Eliminación física')).toBeVisible();
  });
});
