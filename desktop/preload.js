// Preload script for better security (optional)
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  restartServer: () => ipcRenderer.invoke('restart-server'),
  onServerLog: (callback) => ipcRenderer.on('server-log', callback),
  onServerError: (callback) => ipcRenderer.on('server-error', callback),
  openExternal: (url) => ipcRenderer.send('open-external', url)
});