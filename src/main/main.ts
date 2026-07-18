import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { SettingsStore } from './settings-store';
import { createMainWindow, getMainWindow, ensureWindowVisible } from './window-manager';
import {
  createServiceView,
  loadServiceURL,
  setSettingsStore,
  restoreZoomLevel,
} from './service-view';
import { getDefaultService } from './services';
import { setupMenu } from './menu';
import { setupTray, destroyTray } from './tray';
import { registerIpcHandlers } from './ipc';
import { setQuitting, getIsQuitting } from './app-state';
import { RESIZE_DEBOUNCE_MS, LOADING_BAR_TIMEOUT_MS, APP_USER_MODEL_ID } from './constants';

process.on('unhandledRejection', (reason) => {
  console.warn('[App] Unhandled rejection:', reason);
});

if (process.platform === 'win32') {
  app.setAppUserModelId(APP_USER_MODEL_ID);
}

const settings = new SettingsStore();
setSettingsStore(settings);

let viewAdded = false;
let resizeTimer: NodeJS.Timeout | null = null;
let activeView: Electron.WebContentsView | null = null;

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    registerIpcHandlers();
    bootstrapWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      destroyTray();
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      bootstrapWindow();
    } else {
      const win = getMainWindow();
      if (win) {
        win.show();
        win.focus();
      }
    }
  });

  app.on('before-quit', () => {
    setQuitting(true);
    destroyTray();
  });
}

function bootstrapWindow(): void {
  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = null;
  }
  viewAdded = false;
  activeView = null;

  const win = createMainWindow(settings);
  ensureWindowVisible();

  win.loadFile(path.join(__dirname, '../renderer/index.html')).catch((err) => {
    console.warn('[App] Failed to load renderer HTML:', err);
  });

  let view: Electron.WebContentsView;
  try {
    view = createServiceView(getDefaultService());
  } catch (err) {
    console.warn('[App] Failed to create service view:', err);
    win.webContents
      .executeJavaScript(
        `document.getElementById('error-message').textContent = 'Uygulama baslatilamadi: ${escapeForSingleQuotedJs(String(err))}'; document.getElementById('error-screen')?.classList.remove('hidden');`
      )
      .catch(() => {});
    return;
  }
  activeView = view;

  setupViewEvents(win, view);
  loadServiceURL(getDefaultService());
  setupMenu(win, settings);
  restoreZoomLevel();

  setupTray();

  win.on('close', (event) => {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
      resizeTimer = null;
    }
    if (!getIsQuitting()) {
      event.preventDefault();
      win.hide();
    }
  });
}

function escapeForSingleQuotedJs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\$\{/g, '\\${')
    .replace(/`/g, '\\`');
}

function setupViewEvents(win: BrowserWindow, view: Electron.WebContentsView): void {
  view.webContents.on('did-start-loading', () => {
    if (win.isDestroyed()) return;
    win.setProgressBar(-1, { mode: 'indeterminate' });
    win.webContents
      .executeJavaScript(
        `
      (() => {
        if (window.__splashTimer) {
          clearTimeout(window.__splashTimer);
          window.__splashTimer = null;
        }
        document.getElementById('error-screen')?.classList.add('hidden');
        document.getElementById('splash-screen')?.classList.remove('done', 'hidden');
        document.getElementById('splash-screen')?.classList.add('active');
      })();
    `
      )
      .catch((err) => console.warn('Failed to show splash:', err));
  });

  view.webContents.on('did-stop-loading', () => {
    if (win.isDestroyed()) return;
    win.setProgressBar(-1, { mode: 'none' });
    if (!viewAdded && activeView === view) {
      win.contentView.addChildView(view);
      resizeView(win, view);
      viewAdded = true;
      view.webContents.focus();
    }
    win.webContents
      .executeJavaScript(
        `
      (() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('done');
        if (window.__splashTimer) clearTimeout(window.__splashTimer);
        window.__splashTimer = setTimeout(() => {
          if (splash) splash.classList.add('hidden');
          window.__splashTimer = null;
        }, ${LOADING_BAR_TIMEOUT_MS + 300});
      })();
    `
      )
      .catch((err) => console.warn('Failed to hide splash:', err));
  });

  view.webContents.on('did-fail-load', (_event, errorCode, errorDescription, _validatedURL, isMainFrame) => {
    if (win.isDestroyed()) return;
    // Ignore aborted loads and subframe failures
    if (!isMainFrame || errorCode === -3) {
      return;
    }

    win.setProgressBar(-1, { mode: 'none' });
    if (viewAdded && activeView === view) {
      try {
        win.contentView.removeChildView(view);
      } catch {
        // View may already be detached
      }
      viewAdded = false;
    }

    const escaped = escapeForSingleQuotedJs(errorDescription || 'Bilinmeyen hata');
    win.webContents
      .executeJavaScript(
        `
      (() => {
        document.getElementById('splash-screen')?.classList.add('hidden');
        const msg = document.getElementById('error-message');
        if (msg) msg.textContent = '${escaped}';
        document.getElementById('error-screen')?.classList.remove('hidden');
      })();
    `
      )
      .catch((err) => console.warn('Failed to show error screen:', err));
  });

  win.on('resize', () => {
    if (viewAdded && activeView === view && !win.isDestroyed()) {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeView(win, view);
        resizeTimer = null;
      }, RESIZE_DEBOUNCE_MS);
    }
  });
}

function resizeView(win: BrowserWindow, view: Electron.WebContentsView): void {
  if (win.isDestroyed() || view.webContents.isDestroyed()) {
    return;
  }
  const contentBounds = win.getContentBounds();
  view.setBounds({
    x: 0,
    y: 0,
    width: contentBounds.width,
    height: contentBounds.height,
  });
}
