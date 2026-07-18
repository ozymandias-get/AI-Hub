import { app, Menu, Tray, nativeImage } from 'electron';
import { getMainWindow } from './window-manager';
import { setQuitting } from './app-state';
import * as path from 'path';

let tray: Tray | null = null;

export function setupTray(): void {
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
  tray.setToolTip('AI Desktop');

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
          win.webContents.executeJavaScript(
            "document.getElementById('category-select')?.focus();"
          ).catch(() => {});
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

  tray.on('double-click', () => {
    const win = getMainWindow();
    if (win) {
      win.show();
      win.focus();
    }
  });
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
