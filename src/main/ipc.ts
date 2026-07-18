import { ipcMain, shell, BrowserWindow } from 'electron';
import { getCurrentView, getCurrentServiceId, loadServiceURL, switchToService } from './service-view';
import { SERVICE_CATEGORIES, getServiceById } from './services';
import { isAllowedUrl } from './navigation-policy';
import type { SettingsStore } from './settings-store';

let ipcRegistered = false;
let settingsRef: SettingsStore | null = null;

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
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.minimize();
  });

  ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMaximized()) win.unmaximize();
      else win.maximize();
    }
  });

  ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
  });

  ipcMain.handle('get-services', () => {
    return SERVICE_CATEGORIES;
  });

  ipcMain.on('retry-load', () => {
    const view = getCurrentView();
    if (view && !view.webContents.isDestroyed()) {
      const id = getCurrentServiceId();
      if (id) {
        const svc = getServiceById(id);
        if (svc) loadServiceURL(svc);
      }
    }
  });

  ipcMain.on('service-select', (_event, serviceId: string) => {
    const win = BrowserWindow.fromWebContents(_event.sender);
    if (!win || !settingsRef) return;
    switchToService(serviceId, win, settingsRef);
  });

  ipcMain.on('open-external', (_event, url: unknown) => {
    if (!isSafeExternalUrl(url)) return;
    shell.openExternal(url as string).catch((err) => console.warn('Failed to open external URL:', err));
  });
}

export { isAllowedUrl };
