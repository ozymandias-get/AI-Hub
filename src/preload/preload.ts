import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IPC_CHANNELS } from '../shared/constants/ipc';
import type { AIServiceCategory, TabsState, ServiceUIInfo, Language } from '../shared/types';

contextBridge.exposeInMainWorld('aiDesktop', {
  getLanguage: (): Promise<Language> => ipcRenderer.invoke(IPC_CHANNELS.GET_LANGUAGE),
  setLanguage: (language: Language): void => ipcRenderer.send(IPC_CHANNELS.SET_LANGUAGE, language),
  getServices: (): Promise<AIServiceCategory[]> => ipcRenderer.invoke(IPC_CHANNELS.GET_SERVICES),
  getCurrentServiceId: (): Promise<string | null> => ipcRenderer.invoke(IPC_CHANNELS.GET_CURRENT_SERVICE_ID),
  isServiceLoading: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.IS_SERVICE_LOADING),
  showHomepage: (): void => ipcRenderer.send(IPC_CHANNELS.SHOW_HOMEPAGE),
  goBack: (): void => ipcRenderer.send(IPC_CHANNELS.GO_BACK),
  minimize: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximize: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  close: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
  selectService: (id: string): void => ipcRenderer.send(IPC_CHANNELS.SERVICE_SELECT, id),
  retryLoad: (): void => ipcRenderer.send(IPC_CHANNELS.RETRY_LOAD),
  openExternal: (url: string): void => ipcRenderer.send(IPC_CHANNELS.OPEN_EXTERNAL, url),
  getGlobalShortcut: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.GET_GLOBAL_SHORTCUT),
  setGlobalShortcut: (shortcut: string): void => ipcRenderer.send(IPC_CHANNELS.SET_GLOBAL_SHORTCUT, shortcut),
  getAutoLaunch: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.GET_AUTO_LAUNCH),
  setAutoLaunch: (enabled: boolean): void => ipcRenderer.send(IPC_CHANNELS.SET_AUTO_LAUNCH, enabled),

  // Multi-Tab Management API
  getTabsState: (): Promise<TabsState> => ipcRenderer.invoke(IPC_CHANNELS.GET_TABS_STATE),
  createTab: (serviceId?: string): void => ipcRenderer.send(IPC_CHANNELS.CREATE_TAB, serviceId),
  switchTab: (tabId: string): void => ipcRenderer.send(IPC_CHANNELS.SWITCH_TAB, tabId),
  closeTab: (tabId: string): void => ipcRenderer.send(IPC_CHANNELS.CLOSE_TAB, tabId),
  openServiceInTab: (serviceId: string, openInNewTab?: boolean): void => ipcRenderer.send(IPC_CHANNELS.OPEN_SERVICE_IN_TAB, serviceId, openInNewTab),

  onTabsUpdated: (callback: (data: TabsState) => void) => {
    const handler = (_: IpcRendererEvent, data: TabsState) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.TABS_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.TABS_UPDATED, handler);
  },

  onServiceLoadingStart: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on(IPC_CHANNELS.SERVICE_LOADING_START, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SERVICE_LOADING_START, handler);
  },
  onServiceLoadingStop: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on(IPC_CHANNELS.SERVICE_LOADING_STOP, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SERVICE_LOADING_STOP, handler);
  },
  onServiceLoadingError: (callback: (errorDescription: string) => void) => {
    const handler = (_: IpcRendererEvent, desc: string) => callback(desc);
    ipcRenderer.on(IPC_CHANNELS.SERVICE_LOADING_ERROR, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SERVICE_LOADING_ERROR, handler);
  },
  onUpdateServiceUI: (callback: (info: ServiceUIInfo) => void) => {
    const handler = (_: IpcRendererEvent, info: ServiceUIInfo) => callback(info);
    ipcRenderer.on(IPC_CHANNELS.UPDATE_SERVICE_UI, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_SERVICE_UI, handler);
  },
  onMaximizeState: (callback: (isMaximized: boolean) => void) => {
    const handler = (_: IpcRendererEvent, isMaximized: boolean) => callback(isMaximized);
    ipcRenderer.on(IPC_CHANNELS.MAXIMIZE_STATE, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.MAXIMIZE_STATE, handler);
  },
});
