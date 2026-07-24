import { ipcMain, shell, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../shared/constants/ipc';
import { Logger } from '../shared/utils/logger';
import {
  getCurrentView,
  getCurrentServiceId,
  loadServiceURL,
  showHomepage,
  goBack,
  setLanguage,
  createTab,
  switchTab,
  closeTab,
  getTabsInfo,
  getActiveTabId,
  openServiceInTab,
} from './service-view';
import { SERVICE_CATEGORIES, getServiceById } from './services';
import type { SettingsStore } from './settings-store';
import { getMainWindow } from './window-manager';
import { applyAutoLaunch } from './main';

const LOG_TAG = 'IPCMainHandler';

let isIpcRegistered = false;
let settingsStoreRef: SettingsStore | null = null;

function isSenderTrusted(sender: Electron.WebContents): boolean {
  const mainWindow = getMainWindow();
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  return sender === mainWindow.webContents;
}

export function setIpcSettings(settings: SettingsStore): void {
  settingsStoreRef = settings;
}

function isSafeExternalUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
  } catch {
    return false;
  }
}

export function registerIpcHandlers(): void {
  if (isIpcRegistered) return;
  isIpcRegistered = true;

  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, (event) => {
    if (!isSenderTrusted(event.sender)) return;
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) window.minimize();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, (event) => {
    if (!isSenderTrusted(event.sender)) return;
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      if (window.isMaximized()) window.unmaximize();
      else window.maximize();
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, (event) => {
    if (!isSenderTrusted(event.sender)) return;
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) window.close();
  });

  ipcMain.handle(IPC_CHANNELS.GET_SERVICES, (event) => {
    if (!isSenderTrusted(event.sender)) {
      throw new Error('Unauthorized IPC invocation');
    }
    return SERVICE_CATEGORIES;
  });

  ipcMain.handle(IPC_CHANNELS.GET_CURRENT_SERVICE_ID, (event) => {
    if (!isSenderTrusted(event.sender)) {
      throw new Error('Unauthorized IPC invocation');
    }
    return getCurrentServiceId();
  });

  ipcMain.handle(IPC_CHANNELS.IS_SERVICE_LOADING, (event) => {
    if (!isSenderTrusted(event.sender)) {
      throw new Error('Unauthorized IPC invocation');
    }
    const currentView = getCurrentView();
    if (currentView && !currentView.webContents.isDestroyed()) {
      return currentView.webContents.isLoading();
    }
    return false;
  });

  // Multi-Tab IPC Handlers
  ipcMain.handle(IPC_CHANNELS.GET_TABS_STATE, (event) => {
    if (!isSenderTrusted(event.sender)) {
      throw new Error('Unauthorized IPC invocation');
    }
    return {
      tabs: getTabsInfo(),
      activeTabId: getActiveTabId(),
    };
  });

  ipcMain.on(IPC_CHANNELS.CREATE_TAB, (event, serviceId?: string) => {
    if (!isSenderTrusted(event.sender)) return;
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || !settingsStoreRef) return;
    createTab(serviceId, window, settingsStoreRef);
  });

  ipcMain.on(IPC_CHANNELS.SWITCH_TAB, (event, tabId: string) => {
    if (!isSenderTrusted(event.sender)) return;
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || !settingsStoreRef) return;
    switchTab(tabId, window, settingsStoreRef);
  });

  ipcMain.on(IPC_CHANNELS.CLOSE_TAB, (event, tabId: string) => {
    if (!isSenderTrusted(event.sender)) return;
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || !settingsStoreRef) return;
    closeTab(tabId, window, settingsStoreRef);
  });

  ipcMain.on(IPC_CHANNELS.OPEN_SERVICE_IN_TAB, (event, serviceId: string, openInNewTab?: boolean) => {
    if (!isSenderTrusted(event.sender)) return;
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || !settingsStoreRef) return;
    openServiceInTab(serviceId, window, settingsStoreRef, openInNewTab);
  });

  ipcMain.on(IPC_CHANNELS.RETRY_LOAD, (event) => {
    if (!isSenderTrusted(event.sender)) return;
    const currentView = getCurrentView();
    if (currentView && !currentView.webContents.isDestroyed()) {
      const activeServiceId = getCurrentServiceId();
      if (activeServiceId) {
        const serviceItem = getServiceById(activeServiceId);
        if (serviceItem) loadServiceURL(serviceItem);
      }
    }
  });

  ipcMain.on(IPC_CHANNELS.SERVICE_SELECT, (event, serviceId: string) => {
    if (!isSenderTrusted(event.sender)) return;
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || !settingsStoreRef) return;
    openServiceInTab(serviceId, window, settingsStoreRef, false);
  });

  ipcMain.on(IPC_CHANNELS.SHOW_HOMEPAGE, (event) => {
    if (!isSenderTrusted(event.sender)) return;
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || !settingsStoreRef) return;
    showHomepage(window, settingsStoreRef);
  });

  ipcMain.on(IPC_CHANNELS.GO_BACK, (event) => {
    if (!isSenderTrusted(event.sender)) return;
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || !settingsStoreRef) return;
    goBack(window, settingsStoreRef);
  });

  ipcMain.on(IPC_CHANNELS.OPEN_EXTERNAL, (event, url: unknown) => {
    if (!isSenderTrusted(event.sender)) return;
    if (!isSafeExternalUrl(url)) return;
    shell.openExternal(url).catch((error) => Logger.warn(LOG_TAG, 'Failed to open external URL', { error }));
  });

  ipcMain.handle(IPC_CHANNELS.GET_GLOBAL_SHORTCUT, (event) => {
    if (!isSenderTrusted(event.sender)) {
      throw new Error('Unauthorized IPC invocation');
    }
    return settingsStoreRef?.get('globalShortcut') ?? 'Alt+Space';
  });

  ipcMain.handle(IPC_CHANNELS.GET_LANGUAGE, (event) => {
    if (!isSenderTrusted(event.sender)) {
      throw new Error('Unauthorized IPC invocation');
    }
    return settingsStoreRef?.get('language') ?? 'tr';
  });

  ipcMain.on(IPC_CHANNELS.SET_LANGUAGE, (event, language: string) => {
    if (!isSenderTrusted(event.sender)) return;
    if (language !== 'tr' && language !== 'en') return;
    if (settingsStoreRef) {
      settingsStoreRef.set('language', language);
      settingsStoreRef.save();
      setLanguage(language);
    }
  });

  ipcMain.on(IPC_CHANNELS.SET_GLOBAL_SHORTCUT, (event, shortcut: string) => {
    if (!isSenderTrusted(event.sender)) return;
    if (typeof shortcut !== 'string') return;
    if (settingsStoreRef) {
      settingsStoreRef.set('globalShortcut', shortcut);
      settingsStoreRef.save();
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.emit('update-global-shortcut', shortcut);
      }
    }
  });

  ipcMain.handle(IPC_CHANNELS.GET_AUTO_LAUNCH, (event) => {
    if (!isSenderTrusted(event.sender)) {
      throw new Error('Unauthorized IPC invocation');
    }
    return settingsStoreRef?.get('autoLaunch') ?? false;
  });

  ipcMain.on(IPC_CHANNELS.SET_AUTO_LAUNCH, (event, enabled: boolean) => {
    if (!isSenderTrusted(event.sender)) return;
    if (typeof enabled !== 'boolean') return;
    if (settingsStoreRef) {
      settingsStoreRef.set('autoLaunch', enabled);
      settingsStoreRef.save();
      applyAutoLaunch(enabled);
    }
  });
}
