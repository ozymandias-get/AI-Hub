import { app, BrowserWindow, Menu, MenuItemConstructorOptions, shell, dialog } from 'electron';
import {
  navigateToChatGPT,
  reloadChatGPT,
  goBack,
  goForward,
  zoomIn,
  zoomOut,
  zoomReset,
} from './chatgpt-view';
import type { SettingsStore } from './settings-store';
import { setQuitting } from './app-state';
import { CHATGPT_URL } from './constants';

export function setupMenu(win: BrowserWindow, settings: SettingsStore): void {
  const isDev = !app.isPackaged;

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Uygulama',
      submenu: [
        {
          label: 'ChatGPT Ana Sayfası',
          accelerator: 'CmdOrCtrl+L',
          click: () => navigateToChatGPT(),
        },
        { type: 'separator' },
        {
          label: 'Yenile',
          accelerator: 'CmdOrCtrl+R',
          click: () => reloadChatGPT(false),
        },
        {
          label: 'Önbelleği Yok Sayarak Yenile',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => reloadChatGPT(true),
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
          click: () => {
            win.setFullScreen(!win.isFullScreen());
          },
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
          label: "ChatGPT'yi Tarayıcıda Aç",
          click: () => {
            shell.openExternal(CHATGPT_URL).catch((err) => console.warn('Failed to open browser:', err));
          },
        },
        { type: 'separator' },
        {
          label: 'Uygulama Sürümü',
          click: () => {
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'ChatGPT Desktop',
              message: `ChatGPT Desktop v${app.getVersion()}\nElectron: ${process.versions.electron}\nChromium: ${process.versions.chrome}\nNode.js: ${process.versions.node}`,
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
          click: () => {
            win.webContents.toggleDevTools();
          },
        },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
