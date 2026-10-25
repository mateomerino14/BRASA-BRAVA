import {expect, test} from '@playwright/test';
import {loginAs, loginAsDirectorio} from '../src/session.js';

// Abre Reportes y genera el reporte de hoy
const openReports = async (page) => {
  await page.goto('/reportes');
  await expect(page.getByRole('region', {name: 'Totales del período'})).toBeVisible();
  await page.getByRole('button', {name: 'Hoy', exact: true}).click();
  await page.getByRole('button', {name: 'Generar'}).click();
};

test.describe('Reportes de ventas', () => {
  test('resume el día, abre el detalle de la venta cobrada en caja y descarga el PDF', async ({page}) => {
    await loginAs(page, 'admin');
    await openReports(page);
    await expect(page.getByRole('region', {name: 'Totales del período'})).toContainText('98,00');
    await expect(page.getByRole('table', {name: 'Ventas por día'})).toBeVisible();

    await page.getByRole('radio', {name: 'Ventas detalladas'}).click();
    const sales = page.getByRole('table', {name: 'Ventas cobradas'});
    const row = sales.getByRole('row').filter({hasText: 'Mesa 3'});
    await expect(row).toContainText('98,00');
    await row.getByRole('button', {name: /^Ver la venta \d+$/}).click();

    const detail = page.getByRole('dialog', {name: /^Venta Nº \d+ · Bs 98,00$/});
    const first = detail.getByRole('region', {name: 'Envío 1'});
    await expect(first.getByRole('columnheader', {name: 'Consumo'})).toBeVisible();
    await expect(first.getByRole('row').filter({hasText: 'Gaseosa 500 ml'})).toContainText('Para llevar');
    await expect(first.getByRole('row').filter({hasText: 'Hamburguesa Clásica'})).toContainText('Local');
    await expect(first).toContainText('a.romero');
    await expect(detail.getByRole('region', {name: 'Envío 2'})).toContainText('admin');
    await expect(detail.getByRole('complementary', {name: 'Cobro'})).toContainText('Efectivo');
    await detail.getByRole('button', {name: 'Cerrar'}).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', {name: 'Descargar PDF'}).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('filtra por empleado: el cajero que solo abrió la mesa también la ve', async ({page}) => {
    await loginAs(page, 'admin');
    await openReports(page);
    await page.getByRole('radio', {name: 'Ventas detalladas'}).click();
    await page.getByLabel('Empleado').selectOption({label: 'Andrea Romero (a.romero)'});
    await page.getByRole('button', {name: 'Generar'}).click();
    await expect(page.getByRole('table', {name: 'Ventas cobradas'}).getByRole('row').filter({hasText: 'Mesa 3'})).toBeVisible();

    await page.getByLabel('Empleado').selectOption({label: 'Roberto Sánchez (r.sanchez)'});
    await page.getByRole('button', {name: 'Generar'}).click();
    await expect(page.getByRole('table', {name: 'Ventas cobradas'}).getByRole('row').filter({hasText: 'Mesa 3'})).toHaveCount(0);
  });

  test('envía el reporte por correo', async ({page}) => {
    await loginAs(page, 'admin');
    await openReports(page);
    const form = page.getByRole('form', {name: 'Descargar o enviar el reporte'});
    await form.getByLabel('Enviar a este correo').fill('gerencia@brasabrava.bo');
    await form.getByRole('button', {name: 'Enviar por correo'}).click();
    await expect(page.getByText('Se envió el reporte a gerencia@brasabrava.bo')).toBeVisible();
  });

  test('el DIRECTORIO programa, pausa y borra un envío automático', async ({page}) => {
    await loginAsDirectorio(page);
    await openReports(page);
    await page.getByRole('button', {name: 'Envíos programados'}).click();
    const dialog = page.getByRole('dialog', {name: 'Envíos programados'});
    await dialog.getByRole('button', {name: 'Nuevo envío'}).click();
    const form = page.getByRole('dialog', {name: 'Nuevo envío programado'});
    await form.getByLabel(/^Correo de destino/).fill('contador@estudio.bo');
    await form.getByLabel('Reporte').selectOption({label: 'Ventas detalladas'});
    await form.getByRole('button', {name: 'Guardar'}).click();
    await expect(form).toBeHidden();

    const list = dialog.getByRole('list', {name: 'Envíos programados'});
    const toggle = list.getByRole('switch', {name: 'Envío a contador@estudio.bo activo'});
    await expect(toggle).toBeChecked();
    await toggle.click();
    await expect(toggle).not.toBeChecked();

    await list.getByRole('button', {name: 'Borrar el envío a contador@estudio.bo'}).click();
    await page.getByRole('dialog', {name: 'Borrar envío programado'}).getByRole('button', {name: 'Borrar'}).click();
    await expect(list.getByText('contador@estudio.bo')).toHaveCount(0);
  });

  test('un empleado sin el permiso de Reportes no ve la pantalla', async ({page}) => {
    await loginAs(page, 'a.romero');
    await expect(page.getByRole('navigation').getByRole('link', {name: 'Reportes', exact: true})).toHaveCount(0);
  });
});
