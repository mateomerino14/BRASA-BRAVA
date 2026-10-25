import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect, test} from '@playwright/test';
import {loginAs, loginAsDirectorio, stubPrinting} from '../src/session.js';

const outputDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/manual/capturas');
const settleMs = 600;
const jpegQuality = 80;
const loginArea = {clip: {x: 130, y: 0, width: 1106, height: 770}};

// Guarda una captura con el nombre que usa el manual: de la pantalla o, si se indica, solo de una ventana
const capture = async (page, name, target) => {
  for (const close of await page.getByRole('button', {name: 'Cerrar aviso'}).all()) {
    await close.click();
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(settleMs);
  const options = {path: path.join(outputDir, `${name}.jpg`), type: 'jpeg', quality: jpegQuality};
  if (target?.clip) {
    await page.screenshot({...options, clip: target.clip});
    return;
  }
  if (target) {
    await target.screenshot(options);
    return;
  }
  await page.screenshot(options);
};

// Abre una pantalla del menú y espera su título
const openScreen = async (page, route, title) => {
  await page.goto(route);
  await expect(page.getByRole('heading', {name: title, level: 1})).toBeVisible();
};

// Abre el botón de registro de una pantalla de gestión y captura el formulario vacío
const captureRegisterForm = async (page, name, dialogName) => {
  await page.getByRole('main').getByRole('button', {name: /^Registrar/}).first().click();
  const dialog = page.getByRole('dialog', {name: dialogName});
  await expect(dialog).toBeVisible();
  await capture(page, name, dialog);
  await dialog.getByRole('button', {name: 'Cancelar'}).click();
  await expect(dialog).toBeHidden();
};

const tableButton = (page, name) => page.getByRole('region', {name: 'Mesas'}).getByRole('button', {name: new RegExp(`^${name},`)});
const orderPanel = (page) => page.getByRole('region', {name: 'Pedido de la mesa'});
const menu = (page) => page.getByRole('region', {name: 'Menú'});

test.describe.configure({mode: 'serial'});

test.describe('Capturas del manual de usuario', () => {
  test.beforeEach(async ({page}) => {
    await stubPrinting(page);
  });

  test('inicio de sesión', async ({page}) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', {name: 'Inicio de sesión'})).toBeVisible();
    await capture(page, 'login', loginArea);
    await page.getByRole('button', {name: 'Modo directorio'}).click();
    await capture(page, 'login-directorio', loginArea);
    await page.getByRole('button', {name: 'Modo empleado'}).click();
    await page.getByRole('button', {name: '¿Olvidaste tu contraseña?'}).click();
    await expect(page.getByRole('dialog', {name: 'Recuperar contraseña'})).toBeVisible();
    await capture(page, 'recuperar-contrasena', page.getByRole('dialog', {name: 'Recuperar contraseña'}));
  });

  test('página principal y familia', async ({page}) => {
    await loginAs(page, 'admin');
    await expect(page.getByRole('heading', {name: 'Página principal'})).toBeVisible();
    await capture(page, 'home');
    await openScreen(page, '/familia', 'Familia');
    await capture(page, 'familia');
    await page.getByRole('button', {name: 'Ver Hamburguesa Clásica'}).click();
    await expect(page.getByRole('dialog', {name: 'Hamburguesa Clásica'})).toBeVisible();
    await capture(page, 'familia-detalle', page.getByRole('dialog', {name: 'Hamburguesa Clásica'}));
  });

  test('caja', async ({page}) => {
    await loginAs(page, 'a.romero');
    await openScreen(page, '/caja', 'Caja');
    await expect(menu(page)).toBeVisible();
    await capture(page, 'caja');

    await tableButton(page, 'Mesa 2').click();
    await expect(orderPanel(page).getByRole('heading', {name: 'Mesa 2'})).toBeVisible();
    await capture(page, 'caja-mesa-ocupada');

    await tableButton(page, 'Mesa 6').click();
    await menu(page).getByRole('button', {name: /^Hamburguesa Clásica,/}).click();
    const picker = page.getByRole('dialog', {name: 'Hamburguesa Clásica'});
    await picker.getByRole('button', {name: 'Sumar cantidad de Hamburguesa Clásica'}).click();
    await picker.getByRole('button', {name: 'Tomate', exact: true}).click();
    await capture(page, 'caja-agregar-producto', picker);
    await picker.getByRole('button', {name: 'Agregar al pedido'}).click();
    await menu(page).getByRole('button', {name: /^Papas Fritas Clásicas,/}).click();
    const fries = page.getByRole('dialog', {name: 'Papas Fritas Clásicas'});
    await fries.getByRole('radio', {name: 'Para llevar'}).click();
    await fries.getByRole('button', {name: 'Agregar al pedido'}).click();
    await expect(fries).toBeHidden();
    await capture(page, 'caja-pedido-nuevo');
    await tableButton(page, 'Mesa 7').click();
    const discard = page.getByRole('dialog', {name: 'Descartar productos'});
    await capture(page, 'caja-descartar', discard);
    await discard.getByRole('button', {name: 'Cancelar'}).click();

    await orderPanel(page).getByRole('button', {name: 'Enviar a cocina'}).click();
    const kitchen = page.getByRole('dialog', {name: 'Comanda de cocina'});
    await expect(kitchen).toBeVisible();
    await capture(page, 'caja-comanda', kitchen);
    await kitchen.getByRole('button', {name: 'Cerrar'}).click();

    await orderPanel(page).getByRole('button', {name: 'Marcar listos'}).click();
    const ready = page.getByRole('dialog', {name: 'Marcar listos · Mesa 6'});
    await expect(ready).toBeVisible();
    await capture(page, 'caja-marcar-listos', ready);
    await ready.getByRole('button', {name: 'Todo listo'}).click();
    await ready.getByRole('button', {name: 'Cerrar'}).click();

    await orderPanel(page).getByRole('button', {name: 'Cobrar'}).click();
    const checkout = page.getByRole('dialog', {name: 'Cobrar Mesa 6'});
    await checkout.getByLabel('Efectivo recibido').fill('100');
    await capture(page, 'caja-cobro', checkout);
    await checkout.getByRole('button', {name: /^Cobrar Bs/}).click();
    const receipt = page.getByRole('dialog', {name: 'Ticket de venta'});
    await expect(receipt).toBeVisible();
    await capture(page, 'caja-ticket', receipt);
    await receipt.getByRole('button', {name: 'Cerrar'}).click();

    await page.getByRole('button', {name: 'Ventas de hoy'}).click();
    const today = page.getByRole('dialog', {name: 'Ventas de hoy'});
    await expect(today.getByRole('region', {name: 'Totales del día'})).toBeVisible();
    await capture(page, 'caja-ventas-hoy', today);
    const reprint = today.getByRole('button', {name: /^Reimprimir el ticket del pedido/}).first();
    const authorization = page.getByRole('dialog', {name: /^Ticket ya impreso/});
    const maxReprints = 4;
    for (let print = 0; print < maxReprints && !(await authorization.isVisible()); print += 1) {
      await reprint.click();
      const again = page.getByRole('dialog', {name: 'Ticket de venta'});
      await again.getByRole('button', {name: 'Imprimir'}).click();
      await page.waitForTimeout(settleMs);
      if (!(await authorization.isVisible())) {
        await again.getByRole('button', {name: 'Cerrar'}).click();
      }
    }
    await expect(authorization).toBeVisible();
    await capture(page, 'caja-autorizar-reimpresion', authorization);
  });

  test('reportes', async ({page}) => {
    await loginAsDirectorio(page);
    await openScreen(page, '/reportes', 'Reportes de ventas');
    await page.getByRole('button', {name: 'Hoy', exact: true}).click();
    await page.getByRole('button', {name: 'Generar'}).click();
    await expect(page.getByRole('table', {name: 'Ventas por día'})).toBeVisible();
    await capture(page, 'reportes-resumen');
    await page.getByRole('radio', {name: 'Ventas detalladas'}).click();
    const sales = page.getByRole('table', {name: 'Ventas cobradas'});
    await expect(sales).toBeVisible();
    await capture(page, 'reportes-detalladas');
    await sales.getByRole('button', {name: /^Ver la venta/}).first().click();
    await expect(page.getByRole('dialog', {name: /^Venta Nº/})).toBeVisible();
    await capture(page, 'reportes-venta', page.getByRole('dialog', {name: /^Venta Nº/}));
    await page.getByRole('dialog', {name: /^Venta Nº/}).getByRole('button', {name: 'Cerrar'}).click();

    await page.getByRole('button', {name: 'Envíos programados'}).click();
    const schedules = page.getByRole('dialog', {name: 'Envíos programados'});
    await schedules.getByRole('button', {name: 'Nuevo envío'}).click();
    const form = page.getByRole('dialog', {name: 'Nuevo envío programado'});
    await form.getByLabel(/^Correo de destino/).fill('gerencia@brasabrava.bo');
    await capture(page, 'reportes-nuevo-envio', form);
    await form.getByRole('button', {name: 'Guardar'}).click();
    await expect(form).toBeHidden();
    await capture(page, 'reportes-programados', schedules);
  });

  test('administración', async ({page}) => {
    await loginAs(page, 'admin');
    await openScreen(page, '/productos', 'Gestión de productos');
    await capture(page, 'productos');
    await captureRegisterForm(page, 'productos-registrar', 'Registrar nuevo producto');
    await page.getByRole('main').getByRole('searchbox').fill('Hamburguesa Clásica');
    await page.getByRole('button', {name: 'Receta de Hamburguesa Clásica'}).click();
    await expect(page.getByRole('dialog', {name: 'Receta'})).toBeVisible();
    await capture(page, 'productos-receta', page.getByRole('dialog', {name: 'Receta'}));
    await page.getByRole('dialog', {name: 'Receta'}).getByRole('button', {name: 'Cancelar'}).click();

    await openScreen(page, '/categorias', 'Gestión de categorías');
    await capture(page, 'categorias');
    await captureRegisterForm(page, 'categorias-registrar', 'Registrar nueva categoría');

    await page.getByRole('button', {name: 'Dar de baja Hamburguesas'}).click();
    const categoryOff = page.getByRole('dialog', {name: 'Dar de baja categoría'});
    await capture(page, 'categorias-baja', categoryOff);
    await categoryOff.getByRole('button', {name: 'Cancelar'}).click();

    await openScreen(page, '/inventario', 'Inventario de insumos');
    await capture(page, 'inventario');
    await page.getByRole('button', {name: 'Modificar Carne de res'}).click();
    const ingredient = page.getByRole('dialog', {name: 'Modificar insumo'});
    await capture(page, 'inventario-modificar', ingredient);
    await ingredient.getByRole('button', {name: 'Cancelar'}).click();

    await openScreen(page, '/secciones', 'Gestión de secciones');
    await capture(page, 'secciones');
    await captureRegisterForm(page, 'secciones-registrar', 'Registrar nueva sección');

    await openScreen(page, '/promociones', 'Gestión de promociones');
    await capture(page, 'promociones');
    await captureRegisterForm(page, 'promociones-registrar', 'Registrar nueva promoción');

    await openScreen(page, '/empleados', 'Gestión de empleados');
    await capture(page, 'empleados');
    await captureRegisterForm(page, 'empleados-registrar', 'Registrar nuevo empleado');

    await openScreen(page, '/cargos', 'Gestión de cargos');
    await capture(page, 'cargos');
    await page.getByRole('button', {name: 'Modificar Cajero'}).click();
    await expect(page.getByRole('dialog', {name: 'Modificar cargo'})).toBeVisible();
    await capture(page, 'cargos-modificar', page.getByRole('dialog', {name: 'Modificar cargo'}));
  });

  test('eliminación física', async ({page}) => {
    await loginAsDirectorio(page);
    await openScreen(page, '/eliminacion', 'Eliminación física');
    const employees = page.getByRole('table', {name: 'Empleados'});
    await employees.getByRole('row').filter({hasText: 'Javier Ortiz'}).getByRole('cell').nth(1).click();
    await page.getByRole('radiogroup', {name: 'Qué eliminar'}).getByRole('radio', {name: /^Secciones y mesas/}).click();
    const sections = page.getByRole('table', {name: 'Secciones y mesas'});
    await sections.getByRole('row').filter({hasText: 'Salón VIP'}).getByRole('cell').nth(1).click();
    await capture(page, 'eliminacion');
    await page.getByRole('button', {name: /^Eliminar \d+ marcados?$/}).click();
    const dialog = page.getByRole('dialog', {name: 'Eliminar para siempre'});
    await dialog.getByLabel(/^Escriba ELIMINAR/).fill('ELIMINAR');
    await capture(page, 'eliminacion-confirmar', dialog);
    await dialog.getByRole('button', {name: 'Cancelar'}).click();
  });

  test('celular', async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await loginAs(page, 'a.romero');
    await capture(page, 'celular-home');
    await page.getByRole('button', {name: /menú/i}).first().click();
    await capture(page, 'celular-menu');
    await page.keyboard.press('Escape');
    await openScreen(page, '/caja?mesa=2', 'Caja');
    await expect(menu(page)).toBeVisible();
    await capture(page, 'celular-caja');
  });
});
