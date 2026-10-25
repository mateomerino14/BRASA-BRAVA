import {expect} from '@playwright/test';

export const DEMO_PASSWORD = 'Brasa2026';
export const DIRECTORIO_PASSWORD = 'Directorio2026';

// Inicia sesión como empleado y espera a que cargue el panel
export const loginAs = async (page, alias, password = DEMO_PASSWORD) => {
  await page.goto('/login');
  await page.getByLabel('Usuario', {exact: true}).fill(alias);
  await page.getByLabel('Contraseña', {exact: true}).fill(password);
  await page.getByRole('button', {name: 'Ingresar'}).click();
  await expect(page.getByRole('button', {name: 'Cerrar sesión'})).toBeVisible();
};

// Inicia sesión en modo DIRECTORIO
export const loginAsDirectorio = async (page) => {
  await page.goto('/login');
  await page.getByRole('button', {name: 'Modo directorio'}).click();
  await page.getByLabel('Contraseña', {exact: true}).fill(DIRECTORIO_PASSWORD);
  await page.getByRole('button', {name: 'Ingresar'}).click();
  await expect(page.getByRole('heading', {name: 'Página principal'})).toBeVisible();
};

// Reemplaza window.print para contar las impresiones sin abrir el diálogo del navegador
export const stubPrinting = async (page) => {
  await page.addInitScript(() => {
    window.printCalls = 0;
    window.print = () => {
      window.printCalls += 1;
    };
  });
};

// Devuelve cuántas veces la página pidió imprimir
export const printCalls = (page) => page.evaluate(() => window.printCalls);

// Enlace del menú lateral
export const menuLink = (page, name) => page.getByRole('navigation').getByRole('link', {name, exact: true});
