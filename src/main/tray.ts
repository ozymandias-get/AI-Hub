import { app, Menu, Tray, nativeImage } from 'electron';
import { getMainWindow } from './window-manager';
import { setQuitting } from './app-state';
import { showHomepage } from './service-view';
import type { SettingsStore } from './settings-store';
import * as path from 'path';

let tray: Tray | null = null;
let settingsRef: SettingsStore | null = null;

export function setupTray(settings?: SettingsStore): void {
  if (settings) {
    settingsRef = settings;
  }
  if (tray) return;

  let icon: Electron.NativeImage;
  const iconPath = path.join(__dirname, '../../assets/icon.ico');

  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('AI Hub');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Uygulamayı Göster',
      click: () => {
        const win = getMainWindow();
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    {
      label: 'Servis Değiştir',
      click: () => {
        const win = getMainWindow();
        if (win) {
          win.show();
          win.focus();
          if (settingsRef) {
            showHomepage(win, settingsRef);
          }
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: () => {
        setQuitting(true);
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    const win = getMainWindow();
    if (win) {
      win.show();
      win.focus();
    }
  });
  // Removed redundant double-click handler — click already handles show/focus
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
