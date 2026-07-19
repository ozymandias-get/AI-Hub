import { ipcMain, shell, BrowserWindow } from 'electron';
import { getCurrentView, getCurrentServiceId, loadServiceURL, switchToService, showHomepage, goBack, setLanguage } from './service-view';
import { SERVICE_CATEGORIES, getServiceById } from './services';

import type { SettingsStore } from './settings-store';
import { getMainWindow } from './window-manager';

let ipcRegistered = false;
let settingsRef: SettingsStore | null = null;

function isSenderTrusted(sender: any): boolean {
  const win = getMainWindow();
  if (!win || win.isDestroyed()) return false;
  return sender === win.webContents;
}

export function setIpcSettings(settings: SettingsStore): void {
  settingsRef = settings;
}

function isSafeExternalUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function registerIpcHandlers(): void {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.on('window-minimize', (event) => {
    if (!isSenderTrusted(event.sender)) return;
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.minimize();
  });

  ipcMain.on('window-maximize', (event) => {
    if (!isSenderTrusted(event.sender)) return;
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMaximized()) win.unmaximize();
      else win.maximize();
    }
  });

  ipcMain.on('window-close', (event) => {
    if (!isSenderTrusted(event.sender)) return;
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
  });

  ipcMain.handle('get-services', (event) => {
    if (!isSenderTrusted(event.sender)) {
      throw new Error('Unauthorized');
    }
    return SERVICE_CATEGORIES;
  });

  ipcMain.handle('get-current-service-id', (event) => {
    if (!isSenderTrusted(event.sender)) {
      throw new Error('Unauthorized');
    }
    return getCurrentServiceId();
  });

  ipcMain.handle('is-service-loading', (event) => {
    if (!isSenderTrusted(event.sender)) {
      throw new Error('Unauthorized');
    }
    const view = getCurrentView();
    if (view && !view.webContents.isDestroyed()) {
      return view.webContents.isLoading();
    }
    return false;
  });

  ipcMain.on('retry-load', (event) => {
    if (!isSenderTrusted(event.sender)) return;
    const view = getCurrentView();
    if (view && !view.webContents.isDestroyed()) {
      const id = getCurrentServiceId();
      if (id) {
        const svc = getServiceById(id);
        if (svc) loadServiceURL(svc);
      }
    }
  });

  ipcMain.on('service-select', (event, serviceId: string) => {
    if (!isSenderTrusted(event.sender)) return;
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || !settingsRef) return;
    switchToService(serviceId, win, settingsRef);
  });

  ipcMain.on('show-homepage', (event) => {
    if (!isSenderTrusted(event.sender)) return;
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || !settingsRef) return;
    showHomepage(win, settingsRef);
  });

  ipcMain.on('go-back', (event) => {
    if (!isSenderTrusted(event.sender)) return;
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || !settingsRef) return;
    goBack(win, settingsRef);
  });

  ipcMain.on('open-external', (event, url: unknown) => {
    if (!isSenderTrusted(event.sender)) return;
    if (!isSafeExternalUrl(url)) return;
    shell.openExternal(url as string).catch((err) => console.warn('Failed to open external URL:', err));
  });

  ipcMain.handle('get-global-shortcut', (event) => {
    if (!isSenderTrusted(event.sender)) {
      throw new Error('Unauthorized');
    }
    return settingsRef?.get('globalShortcut') ?? 'Alt+Space';
  });

  ipcMain.handle('get-language', (event) => {
    if (!isSenderTrusted(event.sender)) {
      throw new Error('Unauthorized');
    }
    return settingsRef?.get('language') ?? 'tr';
  });

  ipcMain.on('set-language', (event, language: string) => {
    if (!isSenderTrusted(event.sender)) return;
    if (language !== 'tr' && language !== 'en') return;
    if (settingsRef) {
      settingsRef.set('language', language);
      settingsRef.save();
      setLanguage(language);
    }
  });

  ipcMain.on('set-global-shortcut', (event, shortcut: string) => {
    if (!isSenderTrusted(event.sender)) return;
    if (typeof shortcut !== 'string') return;
    if (settingsRef) {
      settingsRef.set('globalShortcut', shortcut);
      settingsRef.save();
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        win.emit('update-global-shortcut', shortcut);
      }
    }
  });
}
