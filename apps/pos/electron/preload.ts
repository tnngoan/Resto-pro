import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose safe Electron APIs to the renderer process via contextBridge.
 * Access in React via `window.electronAPI`.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  toggleFullscreen: (): Promise<boolean> => ipcRenderer.invoke('toggle-fullscreen'),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),

  // ── Printer APIs ──────────────────────────────────────────────
  print: (request: { data: number[]; printerType: string; networkAddress?: string; networkPort?: number }) =>
    ipcRenderer.invoke('printer:print', request),
  listPrinters: () => ipcRenderer.invoke('printer:list'),
  printerStatus: (printerType: string) => ipcRenderer.invoke('printer:status', printerType),

  // Platform detection
  platform: process.platform,
  isElectron: true,
});
