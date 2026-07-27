import { app, BrowserWindow, Menu, session, globalShortcut } from 'electron';
import * as path from 'path';
import { SettingsStore } from './settings-store';
import { createMainWindow, getMainWindow, ensureWindowVisible } from './window-manager';
import { setupPermissions } from './permissions';
import { setupDownloads } from './downloads';
import {
  setSettingsStore,
  setLanguage,
  restoreZoomLevel,
  resizeViewToWindow,
  createTab,
  suspendActiveService,
  resumeActiveService,
} from './service-view';
import { setupMenu } from './menu';
import { setupTray, destroyTray } from './tray';
import { registerIpcHandlers, setIpcSettings } from './ipc';
import { setQuitting, getIsQuitting } from './app-state';
import { RESIZE_DEBOUNCE_MS, APP_USER_MODEL_ID } from './constants';
import { Logger } from '../shared/utils/logger';

const LOG_TAG = 'MainProcess';

process.on('unhandledRejection', (reason) => {
  Logger.warn(LOG_TAG, 'Unhandled promise rejection', { reason });
});

if (process.platform === 'win32') {
  app.setAppUserModelId(APP_USER_MODEL_ID);
}

// Enable GPU rasterization, zero-copy rendering and fast networking for AI web apps
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-features', 'CanvasOopRasterization,ParallelDownloading,TcpFastOpen');

const settings = new SettingsStore();
setSettingsStore(settings);
setLanguage(settings.get('language'));

let resizeTimer: NodeJS.Timeout | null = null;

export function applyAutoLaunch(enabled: boolean): void {
  try {
    if (!app.isPackaged) {
      app.setLoginItemSettings({
        openAtLogin: false,
      });
      return;
    }
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: false,
    });
  } catch (error) {
    Logger.warn(LOG_TAG, 'Failed to update login item settings', { error });
  }
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('web-contents-created', (_event, contents) => {
    contents.on('context-menu', (_e, params) => {
      const currentLang = settings.get('language');
      const isTurkish = currentLang === 'tr';
      const menu = Menu.buildFromTemplate([
        { label: isTurkish ? 'Geri Al' : 'Undo', role: 'undo', enabled: params.editFlags.canUndo },
        { label: isTurkish ? 'Yinele' : 'Redo', role: 'redo', enabled: params.editFlags.canRedo },
        { type: 'separator' },
        { label: isTurkish ? 'Kes' : 'Cut', role: 'cut', enabled: params.editFlags.canCut },
        { label: isTurkish ? 'Kopyala' : 'Copy', role: 'copy', enabled: params.editFlags.canCopy },
        { label: isTurkish ? 'Yapıştır' : 'Paste', role: 'paste', enabled: params.editFlags.canPaste },
        { type: 'separator' },
        { label: isTurkish ? 'Tümünü Seç' : 'Select All', role: 'selectAll', enabled: params.editFlags.canSelectAll },
      ]);
      menu.popup();
    });
  });

  app.on('second-instance', () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    registerIpcHandlers();
    setIpcSettings(settings);
    setupPermissions(session.defaultSession);
    setupDownloads(session.defaultSession);
    bootstrapWindow();
    applyAutoLaunch(settings.get('autoLaunch'));
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
      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  app.on('before-quit', () => {
    setQuitting(true);
    destroyTray();
    globalShortcut.unregisterAll();
  });
}

function isLaunchedInBackground(): boolean {
  const args = process.argv;
  const isHiddenArg =
    args.includes('--hidden') ||
    args.includes('--background') ||
    args.includes('-b') ||
    args.includes('/background');

  let wasOpenedAsHidden = false;
  try {
    wasOpenedAsHidden = app.getLoginItemSettings().wasOpenedAsHidden;
  } catch (error) {
    Logger.debug(LOG_TAG, 'Failed to read wasOpenedAsHidden setting', { error });
  }

  return isHiddenArg || wasOpenedAsHidden;
}

function bootstrapWindow(): void {
  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = null;
  }

  const isBackground = isLaunchedInBackground();
  const mainWindow = createMainWindow(settings, !isBackground);
  ensureWindowVisible();

  if (!app.isPackaged) {
    mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      if (level >= 2) {
        Logger.error('RendererConsole', `Console error [Level ${level}]: ${message} (at ${sourceId}:${line})`);
      }
    });
  }

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html')).catch((error) => {
    Logger.warn(LOG_TAG, 'Failed to load renderer HTML', { error });
  });

  mainWindow.on('hide', () => {
    suspendActiveService();
  });

  mainWindow.on('minimize', () => {
    suspendActiveService();
  });

  mainWindow.on('show', () => {
    resumeActiveService(mainWindow, settings);
  });

  mainWindow.on('restore', () => {
    resumeActiveService(mainWindow, settings);
  });

  if (!isBackground) {
    createTab(undefined, mainWindow, settings);
  }

  setupMenu(mainWindow, settings);
  restoreZoomLevel();
  setupTray(settings);

  const initialShortcut = settings.get('globalShortcut') || 'Alt+Space';
  registerGlobalHotkey(initialShortcut, mainWindow);

  (mainWindow as unknown as import('events').EventEmitter).on('update-global-shortcut', (newShortcut: unknown) => {
    if (typeof newShortcut === 'string') {
      registerGlobalHotkey(newShortcut, mainWindow);
    }
  });

  mainWindow.on('close', (event) => {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
      resizeTimer = null;
    }
    saveWindowState(mainWindow);
    if (!getIsQuitting()) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!mainWindow.isDestroyed()) {
        resizeViewToWindow(mainWindow);
      }
    }, RESIZE_DEBOUNCE_MS);
  });

  mainWindow.on('maximize', () => updateMaximizeButton(mainWindow));
  mainWindow.on('unmaximize', () => updateMaximizeButton(mainWindow));
}

function saveWindowState(mainWindow: BrowserWindow): void {
  const isMaximized = mainWindow.isMaximized();
  if (!isMaximized) {
    const bounds = mainWindow.getBounds();
    settings.setWindow({
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
    });
  }
  settings.setWindow({ isMaximized });
  settings.saveSync();
}

function updateMaximizeButton(mainWindow: BrowserWindow): void {
  if (mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('maximize-state', mainWindow.isMaximized());
}

function registerGlobalHotkey(shortcut: string, mainWindow: BrowserWindow): void {
  globalShortcut.unregisterAll();

  if (!shortcut || shortcut === 'Yok' || shortcut === 'None') {
    return;
  }

  try {
    const isRegistered = globalShortcut.register(shortcut, () => {
      if (mainWindow.isDestroyed()) return;
      if (mainWindow.isVisible() && mainWindow.isFocused() && !mainWindow.isMinimized()) {
        mainWindow.hide();
      } else {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });

    if (!isRegistered) {
      Logger.warn(LOG_TAG, `Failed to register global hotkey: ${shortcut}`);
    }
  } catch (error) {
    Logger.error(LOG_TAG, `Error registering global hotkey ${shortcut}`, error);
  }
}
