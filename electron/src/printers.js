import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const FILE_NAME = 'impresoras.json';
const DESTINATIONS = ['cocina', 'caja'];
const DESTINATION_LABELS = {cocina: 'cocina', caja: 'caja'};
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const PRINT_TIMEOUT_MS = 20000;

const emptyChoice = {cocina: null, caja: null};

// Impresoras elegidas en esta PC para cada destino (null = usar el diálogo de impresión)
export const loadPrinterChoice = (dataDir) => {
  const file = path.join(dataDir, FILE_NAME);
  if (!existsSync(file)) {
    return {...emptyChoice};
  }
  const stored = JSON.parse(readFileSync(file, 'utf8'));
  return {cocina: stored.cocina ?? null, caja: stored.caja ?? null};
};

// Guarda la elección de impresoras; solo acepta nombres de texto o null
export const savePrinterChoice = (dataDir, choice) => {
  const clean = {...emptyChoice};
  for (const destination of DESTINATIONS) {
    const value = choice?.[destination];
    if (typeof value === 'string' && value.trim()) {
      clean[destination] = value.trim();
    }
  }
  mkdirSync(dataDir, {recursive: true});
  writeFileSync(path.join(dataDir, FILE_NAME), JSON.stringify(clean, null, 2));
  return clean;
};

// Opciones para imprimir directo a una impresora, sin diálogo ni márgenes de página
export const silentPrintOptions = (deviceName) => ({
  silent: true,
  deviceName,
  printBackground: false,
  margins: {marginType: 'none'},
});

// Imprime un documento HTML en una ventana oculta y la cierra; resuelve {ok, error}
const printHtml = async ({BrowserWindow, html, deviceName}) => {
  const window = new BrowserWindow({show: false, webPreferences: {sandbox: true, contextIsolation: true, javascript: false}});
  try {
    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    return await new Promise((resolve) => {
      const timer = setTimeout(() => resolve({ok: false, error: 'La impresora no respondió a tiempo'}), PRINT_TIMEOUT_MS);
      window.webContents.print(silentPrintOptions(deviceName), (success, failureReason) => {
        clearTimeout(timer);
        if (success) {
          resolve({ok: true});
        }
        else {
          resolve({ok: false, error: failureReason || 'La impresora rechazó el trabajo'});
        }
      });
    });
  }
  finally {
    window.destroy();
  }
};

// Registra los canales de impresión que usa la interfaz (expuestos por preload.cjs)
export const registerPrinting = ({ipcMain, BrowserWindow, dataDir}) => {
  // Impresoras instaladas en Windows, vistas desde la ventana que pregunta
  ipcMain.handle('printers:list', async (event) => (await event.sender.getPrintersAsync()).map((printer) => ({
    name: printer.name,
    displayName: printer.displayName || printer.name,
    isDefault: Boolean(printer.isDefault),
  })));

  // Elección guardada de impresoras
  ipcMain.handle('printers:get', () => loadPrinterChoice(dataDir));

  // Guarda la elección de impresoras
  ipcMain.handle('printers:save', (_event, choice) => savePrinterChoice(dataDir, choice));

  // Imprime sin diálogo en la impresora del destino (o en "impresora", para la hoja de prueba)
  ipcMain.handle('printers:print', async (event, {destino, html, impresora} = {}) => {
    if (!DESTINATIONS.includes(destino) || typeof html !== 'string' || Buffer.byteLength(html) > MAX_HTML_BYTES) {
      return {ok: false, error: 'Documento de impresión inválido'};
    }
    const deviceName = impresora || loadPrinterChoice(dataDir)[destino];
    if (!deviceName) {
      return {ok: false, error: `No hay una impresora de ${DESTINATION_LABELS[destino]} elegida`};
    }
    const installed = await event.sender.getPrintersAsync();
    if (!installed.some((printer) => printer.name === deviceName)) {
      return {ok: false, error: `La impresora "${deviceName}" no está instalada o no está conectada`, impresora: deviceName};
    }
    const result = await printHtml({BrowserWindow, html, deviceName});
    return {...result, impresora: deviceName};
  });
};
