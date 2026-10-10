import {mkdtempSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {afterAll, describe, expect, it} from 'vitest';
import {loadPrinterChoice, registerPrinting, savePrinterChoice, silentPrintOptions} from '../src/printers.js';

const tempDirs = [];
const tempDir = () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'brasa-printers-'));
  tempDirs.push(dir);
  return dir;
};
afterAll(() => tempDirs.forEach((dir) => rmSync(dir, {recursive: true, force: true})));

const INSTALLED = [
  {name: 'TicketeraCocina', displayName: 'Ticketera Cocina', isDefault: false},
  {name: 'TicketeraCaja', displayName: '', isDefault: true},
];

// Electron falso: guarda los canales registrados y las ventanas ocultas que se abren para imprimir
const fakeElectron = ({printSucceeds = true, failureReason = ''} = {}) => {
  const handlers = {};
  const windows = [];
  class FakeWindow {
    constructor(options) {
      this.options = options;
      this.destroyed = false;
      this.jobs = [];
      this.webContents = {
        print: (printOptions, callback) => {
          this.jobs.push(printOptions);
          callback(printSucceeds, failureReason);
        },
      };
      windows.push(this);
    }

    async loadURL(url) {
      this.url = url;
    }

    destroy() {
      this.destroyed = true;
    }
  }
  const ipcMain = {handle: (channel, handler) => {
    handlers[channel] = handler;
  }};
  const event = {sender: {getPrintersAsync: async () => INSTALLED}};
  const call = (channel, ...args) => handlers[channel](event, ...args);
  return {ipcMain, BrowserWindow: FakeWindow, windows, call};
};

describe('impresoras de la PC de caja', () => {
  it('guarda y lee la impresora de cada destino, ignorando valores inválidos', () => {
    const dir = tempDir();
    expect(loadPrinterChoice(dir)).toEqual({cocina: null, caja: null});
    expect(savePrinterChoice(dir, {cocina: ' TicketeraCocina ', caja: 42, otra: 'x'})).toEqual({cocina: 'TicketeraCocina', caja: null});
    expect(loadPrinterChoice(dir)).toEqual({cocina: 'TicketeraCocina', caja: null});
  });

  it('imprime sin diálogo, sin márgenes y en la impresora elegida', () => {
    expect(silentPrintOptions('TicketeraCaja')).toEqual({silent: true, deviceName: 'TicketeraCaja', printBackground: false, margins: {marginType: 'none'}});
  });

  it('lista las impresoras instaladas y manda la comanda a la de cocina en una ventana oculta', async () => {
    const dir = tempDir();
    const electron = fakeElectron();
    registerPrinting({...electron, dataDir: dir});
    expect(await electron.call('printers:list')).toEqual([
      {name: 'TicketeraCocina', displayName: 'Ticketera Cocina', isDefault: false},
      {name: 'TicketeraCaja', displayName: 'TicketeraCaja', isDefault: true},
    ]);
    await electron.call('printers:save', {cocina: 'TicketeraCocina', caja: 'TicketeraCaja'});
    expect(await electron.call('printers:get')).toEqual({cocina: 'TicketeraCocina', caja: 'TicketeraCaja'});

    const result = await electron.call('printers:print', {destino: 'cocina', html: '<p>COMANDA</p>'});
    expect(result).toEqual({ok: true, impresora: 'TicketeraCocina'});
    const [window] = electron.windows;
    expect(window.options.show).toBe(false);
    expect(decodeURIComponent(window.url)).toBe('data:text/html;charset=utf-8,<p>COMANDA</p>');
    expect(window.jobs[0]).toMatchObject({silent: true, deviceName: 'TicketeraCocina'});
    expect(window.destroyed).toBe(true);
  });

  it('usa la impresora indicada para la hoja de prueba aunque no esté guardada', async () => {
    const electron = fakeElectron();
    registerPrinting({...electron, dataDir: tempDir()});
    const result = await electron.call('printers:print', {destino: 'caja', html: '<p>PRUEBA</p>', impresora: 'TicketeraCaja'});
    expect(result).toEqual({ok: true, impresora: 'TicketeraCaja'});
  });

  it('avisa si no hay impresora elegida, si ya no está instalada o si falla, y rechaza documentos inválidos', async () => {
    const dir = tempDir();
    const electron = fakeElectron({printSucceeds: false, failureReason: 'Sin papel'});
    registerPrinting({...electron, dataDir: dir});
    expect(await electron.call('printers:print', {destino: 'caja', html: '<p>x</p>'})).toEqual({ok: false, error: 'No hay una impresora de caja elegida'});
    await electron.call('printers:save', {caja: 'ImpresoraVieja'});
    expect(await electron.call('printers:print', {destino: 'caja', html: '<p>x</p>'})).toMatchObject({ok: false, error: 'La impresora "ImpresoraVieja" no está instalada o no está conectada'});
    await electron.call('printers:save', {caja: 'TicketeraCaja'});
    expect(await electron.call('printers:print', {destino: 'caja', html: '<p>x</p>'})).toEqual({ok: false, error: 'Sin papel', impresora: 'TicketeraCaja'});
    expect(electron.windows.every((window) => window.destroyed)).toBe(true);
    expect(await electron.call('printers:print', {destino: 'barra', html: '<p>x</p>'})).toEqual({ok: false, error: 'Documento de impresión inválido'});
    expect(await electron.call('printers:print', {destino: 'caja'})).toEqual({ok: false, error: 'Documento de impresión inválido'});
  });
});
