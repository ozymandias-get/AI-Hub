import { app, BrowserWindow, Menu, MenuItemConstructorOptions, shell, dialog } from 'electron';
import {
  reloadService,
  goBack,
  goForward,
  zoomIn,
  zoomOut,
  zoomReset,
  getCurrentServiceId,
  switchToService,
} from './service-view';
import { SERVICE_CATEGORIES, getServiceById } from './services';
import type { SettingsStore } from './settings-store';
import { setQuitting } from './app-state';

export function setupMenu(win: BrowserWindow, settings: SettingsStore): void {
  const isDev = !app.isPackaged;

  const servislerSubmenu: MenuItemConstructorOptions[] = [];
  for (const cat of SERVICE_CATEGORIES) {
    servislerSubmenu.push({
      label: `── ${cat.name} ──`,
      enabled: false,
    });
    for (const svc of cat.services) {
      servislerSubmenu.push({
        label: svc.name,
        click: () => switchToService(svc.id, win, settings),
      });
    }
    servislerSubmenu.push({ type: 'separator' });
  }

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Uygulama',
      submenu: [
        {
          label: 'Servis Değiştir',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            win.webContents.focus();
            win.webContents.executeJavaScript(
              "document.getElementById('category-select')?.focus();"
            ).catch(() => {});
          },
        },
        { type: 'separator' },
        {
          label: 'Yenile',
          accelerator: 'CmdOrCtrl+R',
          click: () => reloadService(false),
        },
        {
          label: 'Önbelleği Yok Sayarak Yenile',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => reloadService(true),
        },
        { type: 'separator' },
        {
          label: 'Uygulamayı Yeniden Başlat',
          click: () => {
            setQuitting(true);
            app.relaunch();
            app.quit();
          },
        },
        { type: 'separator' },
        {
          label: 'Çıkış',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            setQuitting(true);
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Servisler',
      submenu: servislerSubmenu,
    },
    {
      label: 'Görünüm',
      submenu: [
        {
          label: 'Yakınlaştır',
          accelerator: 'CmdOrCtrl+=',
          click: () => zoomIn(),
        },
        {
          label: 'Uzaklaştır',
          accelerator: 'CmdOrCtrl+-',
          click: () => zoomOut(),
        },
        {
          label: 'Yakınlaştırmayı Sıfırla',
          accelerator: 'CmdOrCtrl+0',
          click: () => zoomReset(),
        },
        { type: 'separator' },
        {
          label: 'Tam Ekran',
          accelerator: 'F11',
          click: () => { win.setFullScreen(!win.isFullScreen()); },
        },
      ],
    },
    {
      label: 'Gezinme',
      submenu: [
        {
          label: 'Geri',
          accelerator: 'Alt+Left',
          click: () => goBack(),
        },
        {
          label: 'İleri',
          accelerator: 'Alt+Right',
          click: () => goForward(),
        },
      ],
    },
    {
      label: 'Yardım',
      submenu: [
        {
          label: 'Servisi Tarayıcıda Aç',
          click: () => {
            const id = getCurrentServiceId();
            if (id) {
              const svc = getServiceById(id);
              if (svc) shell.openExternal(svc.url).catch((err) => console.warn('Failed to open browser:', err));
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Uygulama Sürümü',
          click: () => {
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'AI Desktop',
              message: `AI Desktop v${app.getVersion()}\nElectron: ${process.versions.electron}\nChromium: ${process.versions.chrome}\nNode.js: ${process.versions.node}`,
            }).catch((err) => console.warn('Failed to show version dialog:', err));
          },
        },
      ],
    },
  ];

  if (isDev) {
    template.push({
      label: 'Geliştirme',
      submenu: [
        {
          label: 'Geliştirici Araçları',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => { win.webContents.toggleDevTools(); },
        },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
