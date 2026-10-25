// Escapa un texto para usarlo dentro de una expresión regular
export const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Barra de secciones y mesas de Caja
const tablesBar = (page) => page.getByRole('region', {name: 'Mesas'});

// Botón de una mesa en la barra de Caja
export const tableButton = (page, name) => tablesBar(page).getByRole('button', {name: new RegExp(`^${escapeRegExp(name)},`)});

// Panel con el pedido de la mesa elegida
export const orderPanel = (page) => page.getByRole('region', {name: 'Pedido de la mesa'});

// Menú del día de Caja
export const menu = (page) => page.getByRole('region', {name: 'Menú'});
