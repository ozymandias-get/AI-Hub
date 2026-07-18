import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { SettingsStore } from './settings-store';
import {
  MIN_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
} from './constants';
let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function createMainWindow(settings: SettingsStore): BrowserWindow {
  const winSettings = settings.getWindow();

  const win = new BrowserWindow({
    width: winSettings.width,
    height: winSettings.height,
    x: winSettings.x,
    y: winSettings.y,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    show: false,
    icon: path.join(__dirname, '../../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  if (winSettings.isMaximized) {
    win.maximize();
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('close', () => {
    // Runs on every close attempt, even if minimize-to-tray cancels it later.
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
  });

  win.on('closed', () => {
    mainWindow = null;
  });

  mainWindow = win;
  return win;
}

export function ensureWindowVisible(): void {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  const displayBounds = screen.getDisplayMatching(bounds).workArea;
  const isVisible =
    bounds.x < displayBounds.x + displayBounds.width &&
    bounds.x + bounds.width > displayBounds.x &&
    bounds.y < displayBounds.y + displayBounds.height &&
    bounds.y + bounds.height > displayBounds.y;

  if (!isVisible) {
    mainWindow.center();
    mainWindow.setSize(DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT);
  }
}
