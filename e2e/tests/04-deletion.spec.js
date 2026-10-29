import {expect, test} from '@playwright/test';
import {loginAs, loginAsDirectorio} from '../src/session.js';

// Pestañas de tipos de la eliminación física
const tabs = (page) => page.getByRole('radiogroup', {name: 'Qué eliminar'});

// Marca la fila que contiene el texto tocando la fila, como lo hace el usuario
const markRow = async (table, text) => {
  const row = table.getByRole('row').filter({hasText: text});
  await row.getByRole('cell').nth(1).click();
  await expect(row.getByRole('checkbox')).toBeChecked();
  return row;
};

test.describe('Eliminación física en cascada', () => {
  test('borra lo dado de baja y una venta cobrada, con lo que arrastra cada uno', async ({page}) => {
    await loginAsDirectorio(page);
    await page.goto('/eliminacion');

    const employees = page.getByRole('table', {name: 'Empleados'});
    await markRow(employees, 'Javier Ortiz');

    await tabs(page).getByRole('radio', {name: /^Secciones y mesas/}).click();
    const sections = page.getByRole('table', {name: 'Secciones y mesas'});
    const vip = await markRow(sections, 'Salón VIP');
    await expect(vip).toContainText('2 mesas');

    await tabs(page).getByRole('radio', {name: /^Ventas/}).click();
    const sales = page.getByRole('table', {name: 'Ventas'});
    await markRow(sales, 'Mesa 3');

    await page.getByRole('button', {name: 'Eliminar 3 marcados'}).click();
    const dialog = page.getByRole('dialog', {name: 'Eliminar para siempre'});
    await expect(dialog).toContainText('Javier Ortiz');
    await expect(dialog).toContainText('Salón VIP');
    await expect(dialog).toContainText('VIP 1');
    await expect(dialog).toContainText('Ventas elegidas: 1 venta');

    const confirm = dialog.getByRole('button', {name: 'Sí, eliminar'});
    const word = dialog.getByLabel(/^Escriba ELIMINAR/);
    await word.fill('eliminar ya');
    await confirm.click();
    await expect(dialog).toBeVisible();
    await word.fill('ELIMINAR');
    await confirm.click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', {name: 'Eliminar 0 marcados'})).toBeDisabled();
    await expect(sales.getByRole('row').filter({hasText: 'Mesa 3'})).toHaveCount(0);

    await tabs(page).getByRole('radio', {name: /^Empleados/}).click();
    await expect(page.getByText('No hay empleados dados de baja.')).toBeVisible();
  });

  test('la venta borrada ya no aparece en los reportes', async ({page}) => {
    await loginAs(page, 'admin');
    await page.goto('/reportes');
    await page.getByRole('button', {name: 'Hoy', exact: true}).click();
    await page.getByRole('radio', {name: 'Ventas detalladas'}).click();
    await page.getByRole('button', {name: 'Generar'}).click();
    await expect(page.getByRole('region', {name: 'Totales del período'})).toBeVisible();
    await expect(page.getByRole('row').filter({hasText: 'Mesa 3'})).toHaveCount(0);
  });

  test('solo el DIRECTORIO entra a la eliminación física', async ({page}) => {
    await loginAs(page, 'admin');
    await page.goto('/eliminacion');
    await expect(page.getByRole('radiogroup', {name: 'Qué eliminar'})).toHaveCount(0);
  });
});
