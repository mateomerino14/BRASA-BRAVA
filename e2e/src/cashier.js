import {expect} from '@playwright/test';

// Escapa un texto para usarlo dentro de una expresión regular
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Barra de secciones y mesas de Caja
const tablesBar = (page) => page.getByRole('region', {name: 'Mesas'});

// Botón de una mesa en la barra de Caja
export const tableButton = (page, name) => tablesBar(page).getByRole('button', {name: new RegExp(`^${escapeRegExp(name)},`)});

// Panel con el pedido de la mesa elegida
export const orderPanel = (page) => page.getByRole('region', {name: 'Pedido de la mesa'});

// Menú del día de Caja
export const menu = (page) => page.getByRole('region', {name: 'Menú'});

// Toca un producto del menú, ajusta el diálogo y lo agrega al pedido
export const addItem = async (page, name, {times = 0, remove = [], llevar = false} = {}) => {
  await menu(page).getByRole('button', {name: new RegExp(`^${escapeRegExp(name)},`)}).click();
  const dialog = page.getByRole('dialog', {name});
  await expect(dialog).toBeVisible();
  for (let index = 0; index < times; index += 1) {
    await dialog.getByRole('button', {name: `Sumar cantidad de ${name}`}).click();
  }
  for (const ingredient of remove) {
    await dialog.getByRole('button', {name: ingredient, exact: true}).click();
  }
  if (llevar) {
    await dialog.getByRole('radio', {name: 'Para llevar'}).click();
  }
  await dialog.getByRole('button', {name: 'Agregar al pedido'}).click();
  await expect(dialog).toBeHidden();
};

// Cierra la comanda que se abre después de enviar a cocina
export const closeKitchenTicket = async (page, envio) => {
  const dialog = page.getByRole('dialog', {name: 'Comanda de cocina'});
  await expect(dialog.getByRole('article', {name: `Comanda del envío ${envio}`})).toBeVisible();
  await dialog.getByRole('button', {name: 'Cerrar'}).click();
  await expect(dialog).toBeHidden();
  return dialog;
};
