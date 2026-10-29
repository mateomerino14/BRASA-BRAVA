import {expect} from '@playwright/test';

export const demoPassword = 'Brasa2026';
export const directorioPassword = 'Directorio2026';

// Inicia sesión eligiendo al empleado en el carrusel del login
export const loginAs = async (page, alias, password = demoPassword) => {
  await page.goto('/login');
  await page.getByRole('button', {name: new RegExp(`${alias.replace('.', '\\.')}$`)}).first().click();
  await page.getByRole('textbox', {name: 'Contraseña'}).fill(password);
  await page.getByRole('button', {name: 'Ingresar'}).click();
  await expect(page).not.toHaveURL(/\/login$/);
};

// Inicia sesión como DIRECTORIO
export const loginDirectorio = async (page) => {
  await page.goto('/login');
  await page.getByRole('button', {name: 'Modo directorio'}).click();
  await page.getByRole('textbox', {name: 'Contraseña'}).fill(directorioPassword);
  await page.getByRole('button', {name: 'Ingresar'}).click();
  await expect(page).not.toHaveURL(/\/login$/);
};

// Reemplaza el diálogo de impresión del navegador por un contador
export const stubPrint = async (page) => {
  await page.addInitScript(() => {
    window.__prints = 0;
    window.print = () => {
      window.__prints += 1;
    };
  });
};

// Cantidad de veces que la página pidió imprimir
export const printCount = (page) => page.evaluate(() => window.__prints);
