// Puente entre la interfaz y la app de escritorio: solo expone la impresión directa (sin acceso a Node)
const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('brasaDesktop', {
  listPrinters: () => ipcRenderer.invoke('printers:list'),
  getPrinters: () => ipcRenderer.invoke('printers:get'),
  savePrinters: (choice) => ipcRenderer.invoke('printers:save', choice),
  print: (job) => ipcRenderer.invoke('printers:print', job),
});
