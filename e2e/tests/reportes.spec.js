import {expect, test} from '@playwright/test';
import {loginDirectorio} from './helpers.js';

test.describe('Reportes', () => {
  test.beforeEach(async ({page}) => {
    await loginDirectorio(page);
    await page.goto('/reportes');
  });

  test('muestra el resumen del día con sus totales', async ({page}) => {
    await expect(page.getByRole('region', {name: 'Totales del período'})).toBeVisible();
    await expect(page.getByRole('table', {name: 'Ventas por día'})).toContainText('Total del período');
  });

  test('cambia a ventas detalladas', async ({page}) => {
    await page.getByRole('radio', {name: 'Ventas detalladas'}).click();
    await page.getByRole('button', {name: 'Generar'}).click();
    await expect(page.getByRole('table').first()).toBeVisible();
  });

  test('descarga el PDF del reporte', async ({page}) => {
    const download = page.waitForEvent('download');
    await page.getByRole('button', {name: 'Descargar PDF'}).click();
    expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('envía el reporte por correo', async ({page}) => {
    await page.getByRole('textbox', {name: 'Enviar a este correo'}).fill('gerencia@brasabrava.bo');
    await page.getByRole('button', {name: 'Enviar por correo'}).click();
    await expect(page.getByText(/gerencia@brasabrava\.bo/).last()).toBeVisible();
  });
});
