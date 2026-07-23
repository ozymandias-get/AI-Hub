import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('aiDesktop', {
  getLanguage: (): Promise<string> => ipcRenderer.invoke('get-language'),
  setLanguage: (language: string): void => ipcRenderer.send('set-language', language),
  getServices: (): Promise<any[]> => ipcRenderer.invoke('get-services'),
  getCurrentServiceId: (): Promise<string> => ipcRenderer.invoke('get-current-service-id'),
  isServiceLoading: (): Promise<boolean> => ipcRenderer.invoke('is-service-loading'),
  showHomepage: (): void => ipcRenderer.send('show-homepage'),
  goBack: (): void => ipcRenderer.send('go-back'),
  minimize: (): void => ipcRenderer.send('window-minimize'),
  maximize: (): void => ipcRenderer.send('window-maximize'),
  close: (): void => ipcRenderer.send('window-close'),
  selectService: (id: string): void => ipcRenderer.send('service-select', id),
  retryLoad: (): void => ipcRenderer.send('retry-load'),
  openExternal: (url: string): void => ipcRenderer.send('open-external', url),
  getGlobalShortcut: (): Promise<string> => ipcRenderer.invoke('get-global-shortcut'),
  setGlobalShortcut: (shortcut: string): void => ipcRenderer.send('set-global-shortcut', shortcut),
  getAutoLaunch: (): Promise<boolean> => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enabled: boolean): void => ipcRenderer.send('set-auto-launch', enabled),
  
  // Tab Management API
  getTabsState: (): Promise<{ tabs: any[]; activeTabId: string | null }> => ipcRenderer.invoke('get-tabs-state'),
  createTab: (serviceId?: string): void => ipcRenderer.send('create-tab', serviceId),
  switchTab: (tabId: string): void => ipcRenderer.send('switch-tab', tabId),
  closeTab: (tabId: string): void => ipcRenderer.send('close-tab', tabId),
  openServiceInTab: (serviceId: string, openInNewTab?: boolean): void => ipcRenderer.send('open-service-in-tab', serviceId, openInNewTab),
  onTabsUpdated: (callback: (data: { tabs: any[]; activeTabId: string | null }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('tabs-updated', handler);
    return () => ipcRenderer.removeListener('tabs-updated', handler);
  },

  onServiceLoadingStart: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('service-loading-start', handler);
    return () => ipcRenderer.removeListener('service-loading-start', handler);
  },
  onServiceLoadingStop: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('service-loading-stop', handler);
    return () => ipcRenderer.removeListener('service-loading-stop', handler);
  },
  onServiceLoadingError: (callback: (errorDescription: string) => void) => {
    const handler = (_: any, desc: string) => callback(desc);
    ipcRenderer.on('service-loading-error', handler);
    return () => ipcRenderer.removeListener('service-loading-error', handler);
  },
  onUpdateServiceUI: (callback: (info: any) => void) => {
    const handler = (_: any, info: any) => callback(info);
    ipcRenderer.on('update-service-ui', handler);
    return () => ipcRenderer.removeListener('update-service-ui', handler);
  },
  onMaximizeState: (callback: (isMaximized: boolean) => void) => {
    const handler = (_: any, isMaximized: boolean) => callback(isMaximized);
    ipcRenderer.on('maximize-state', handler);
    return () => ipcRenderer.removeListener('maximize-state', handler);
  },
});
