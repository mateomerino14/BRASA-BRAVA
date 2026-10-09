import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {app, BrowserWindow, dialog, shell} from 'electron';
import {loadSettings} from './settings.js';
import {startDesktopServices} from './services.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
// Carpeta del frontend compilado: dentro del instalador o en el repositorio durante el desarrollo
const resolveStaticDir = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'frontend');
  }
  return path.resolve(ROOT, '../../frontend/dist');
};
const STATIC_DIR = resolveStaticDir();

let services;

// Crea la ventana principal con el color de la marca mientras carga
const createWindow = (url) => {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#F7F8FA',
    title: 'Brasa Brava',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {contextIsolation: true, sandbox: true, nodeIntegration: false},
  });
  window.once('ready-to-show', () => window.show());
  // Los enlaces externos (redes sociales) se abren en el navegador del sistema
  window.webContents.setWindowOpenHandler(({url: target}) => {
    shell.openExternal(target);
    return {action: 'deny'};
  });
  window.loadURL(url);
};

// Arranca base de datos y API, y abre la ventana
const boot = async () => {
  const dataDir = app.getPath('userData');
  services = await startDesktopServices({
    dataDir,
    staticDir: STATIC_DIR,
    settings: loadSettings(dataDir),
  });
  createWindow(process.env.ELECTRON_DEV_URL ?? services.url);
};

if (!app.requestSingleInstanceLock()) {
  app.quit();
}
else {
  app.on('second-instance', () => BrowserWindow.getAllWindows()[0]?.focus());
  app
    .whenReady()
    .then(boot)
    .catch((error) => {
      dialog.showErrorBox('Brasa Brava no pudo iniciar', error.message);
      app.quit();
    });
  app.on('window-all-closed', () => app.quit());
  app.on('will-quit', (event) => {
    if (!services) {
      return;
    }
    event.preventDefault();
    const running = services;
    services = undefined;
    running.stop().finally(() => app.exit(0));
  });
}
