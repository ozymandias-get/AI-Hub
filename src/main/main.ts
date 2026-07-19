import { app, BrowserWindow, shell, Menu, session, globalShortcut } from 'electron';
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
  switchToService,
  showHomepage,
  suspendActiveService,
  resumeActiveService,
} from './service-view';
import { setupMenu } from './menu';
import { setupTray, destroyTray } from './tray';
import { registerIpcHandlers, setIpcSettings } from './ipc';
import { setQuitting, getIsQuitting } from './app-state';
import { RESIZE_DEBOUNCE_MS, APP_USER_MODEL_ID } from './constants';

process.on('unhandledRejection', (reason) => {
  console.warn('[App] Unhandled rejection:', reason);
});

if (process.platform === 'win32') {
  app.setAppUserModelId(APP_USER_MODEL_ID);
}

const settings = new SettingsStore();
setSettingsStore(settings);
setLanguage(settings.get('language'));

let resizeTimer: NodeJS.Timeout | null = null;

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('web-contents-created', (event, contents) => {
    (contents as any).on('will-attach-web-contents', (e: any, webPreferences: any) => {
      if (webPreferences.preload && !webPreferences.preload.includes('preload.js')) {
        webPreferences.preload = undefined;
      }
      webPreferences.nodeIntegration = false;
      webPreferences.contextIsolation = true;
      webPreferences.sandbox = true;
      webPreferences.webSecurity = true;
    });

    contents.on('context-menu', (e, params) => {
      const lang = settings.get('language');
      const isTR = lang === 'tr';
      const menu = Menu.buildFromTemplate([
        { label: isTR ? 'Geri Al' : 'Undo', role: 'undo', enabled: params.editFlags.canUndo },
        { label: isTR ? 'Yinele' : 'Redo', role: 'redo', enabled: params.editFlags.canRedo },
        { type: 'separator' },
        { label: isTR ? 'Kes' : 'Cut', role: 'cut', enabled: params.editFlags.canCut },
        { label: isTR ? 'Kopyala' : 'Copy', role: 'copy', enabled: params.editFlags.canCopy },
        { label: isTR ? 'Yapıştır' : 'Paste', role: 'paste', enabled: params.editFlags.canPaste },
        { type: 'separator' },
        { label: isTR ? 'Tümünü Seç' : 'Select All', role: 'selectAll', enabled: params.editFlags.canSelectAll }
      ]);
      menu.popup();
    });
  });

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
    setIpcSettings(settings);
    setupPermissions(session.defaultSession);
    setupDownloads(session.defaultSession);
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
    globalShortcut.unregisterAll();
  });
}

function isLaunchedInBackground(): boolean {
  const args = process.argv;
  const isHiddenArg = args.includes('--hidden') || args.includes('--background') || args.includes('-b') || args.includes('/background');
  
  let wasOpenedAsHidden = false;
  try {
    wasOpenedAsHidden = app.getLoginItemSettings().wasOpenedAsHidden;
  } catch (err) {
    // Ignore error
  }

  return isHiddenArg || wasOpenedAsHidden;
}

function bootstrapWindow(): void {
  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = null;
  }

  const isBg = isLaunchedInBackground();
  console.log('[App] isLaunchedInBackground:', isBg, 'argv:', process.argv);
  const win = createMainWindow(settings, !isBg);
  ensureWindowVisible();

  // Only forward renderer console messages in development to reduce IPC overhead
  if (!app.isPackaged) {
    win.webContents.on('console-message', (event: any, ...args: any[]) => {
      if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
        const details = args[0];
        console.log(`[Renderer Console] [Level ${details.level}] ${details.message} (at ${details.sourceId}:${details.line})`);
      } else {
        const [level, message, line, sourceId] = args;
        console.log(`[Renderer Console] [Level ${level}] ${message} (at ${sourceId}:${line})`);
      }
    });
  }

  win.loadFile(path.join(__dirname, '../renderer/index.html')).catch((err) => {
    console.warn('[App] Failed to load renderer HTML:', err);
  });

  // Register window lifecycle listeners for background resource optimization
  win.on('hide', () => {
    suspendActiveService();
  });

  win.on('minimize', () => {
    suspendActiveService();
  });

  win.on('show', () => {
    resumeActiveService(win, settings);
  });

  win.on('restore', () => {
    resumeActiveService(win, settings);
  });

  // Initial load logic
  if (isBg) {
    // Rely on 'show' event listener (handled above) to load service on first show.
  } else {
    const lastServiceId = settings.getWindow().lastService;
    if (lastServiceId) {
      switchToService(lastServiceId, win, settings);
    } else {
      showHomepage(win, settings);
    }
  }

  setupMenu(win, settings);
  restoreZoomLevel();
  setupTray(settings);

  // Register global hotkey
  const initialShortcut = settings.get('globalShortcut') || 'Alt+Space';
  registerGlobalHotkey(initialShortcut, win);

  (win as any).on('update-global-shortcut', (newShortcut: string) => {
    registerGlobalHotkey(newShortcut, win);
  });

  win.on('close', (event) => {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
      resizeTimer = null;
    }
    saveWindowState(win);
    if (!getIsQuitting()) {
      event.preventDefault();
      win.hide();
    }
  });

  win.on('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!win.isDestroyed()) {
        resizeViewToWindow(win);
      }
    }, RESIZE_DEBOUNCE_MS);
  });

  win.on('maximize', () => updateMaximizeButton(win));
  win.on('unmaximize', () => updateMaximizeButton(win));
}

function saveWindowState(win: BrowserWindow): void {
  const maximized = win.isMaximized();
  if (!maximized) {
    const bounds = win.getBounds();
    settings.setWindow({
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
    });
  }
  settings.setWindow({ isMaximized: maximized });
  settings.saveSync();
}

function updateMaximizeButton(win: BrowserWindow): void {
  if (win.isDestroyed()) return;
  win.webContents.send('maximize-state', win.isMaximized());
}

function registerGlobalHotkey(shortcut: string, win: BrowserWindow): void {
  globalShortcut.unregisterAll();

  if (!shortcut || shortcut === 'Yok' || shortcut === 'None') {
    console.log('[App] Global hotkey disabled');
    return;
  }

  try {
    const isRegistered = globalShortcut.register(shortcut, () => {
      if (win.isDestroyed()) return;
      if (win.isVisible() && win.isFocused() && !win.isMinimized()) {
        win.hide();
      } else {
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
      }
    });

    if (!isRegistered) {
      console.warn(`[App] Failed to register global hotkey: ${shortcut}`);
    } else {
      console.log(`[App] Registered global hotkey: ${shortcut}`);
    }
  } catch (err) {
    console.error(`[App] Error registering global hotkey ${shortcut}:`, err);
  }
}
