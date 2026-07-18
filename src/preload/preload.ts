import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('aiDesktop', {
  getServices: (): Promise<any[]> => ipcRenderer.invoke('get-services'),
  minimize: (): void => ipcRenderer.send('window-minimize'),
  maximize: (): void => ipcRenderer.send('window-maximize'),
  close: (): void => ipcRenderer.send('window-close'),
  selectService: (id: string): void => ipcRenderer.send('service-select', id),
  retryLoad: (): void => ipcRenderer.send('retry-load'),
  openExternal: (url: string): void => ipcRenderer.send('open-external', url),
});
