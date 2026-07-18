### Task 3: Frameless Window + IPC Handlers + Preload

**Files:**
- Modify: `src/main/window-manager.ts`
- Modify: `src/main/ipc.ts`
- Modify: `src/preload/preload.ts`

**Interfaces:**
- Consumes: `AIService`, `SERVICE_CATEGORIES` from services.ts
- Produces: IPC channels `service-select`, `window-minimize`, `window-maximize`, `window-close`, `get-services`, `update-title`

- [ ] **Step 1: Update `src/main/window-manager.ts` for frameless**

Replace `createMainWindow`:

```typescript
import { MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT, DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT } from './constants';

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
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, '../../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  // ... rest stays the same
}
```

- [ ] **Step 2: Update `src/main/ipc.ts`**

Add new IPC handlers. Note: `registerIpcHandlers` now accepts a `SettingsStore` reference:

```typescript
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
```

- [ ] **Step 3: Update `src/preload/preload.ts`**

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('aiDesktop', {
  getServices: (): Promise<any[]> => ipcRenderer.invoke('get-services'),
  minimize: (): void => ipcRenderer.send('window-minimize'),
  maximize: (): void => ipcRenderer.send('window-maximize'),
  close: (): void => ipcRenderer.send('window-close'),
  selectService: (id: string): void => ipcRenderer.send('service-select', id),
  retryLoad: (): void => ipcRenderer.send('retry-load'),
  openExternal: (url: string): void => ipcRenderer.send('open-external', url),
});
```

Also update `src/renderer/global.d.ts` to add `aiDesktop` type:

```typescript
export interface AiDesktopAPI {
  getServices(): Promise<any[]>;
  minimize(): void;
  maximize(): void;
  close(): void;
  selectService(id: string): void;
  retryLoad(): void;
  openExternal(url: string): void;
}

declare global {
  interface Window {
    aiDesktop: AiDesktopAPI;
    chatgptDesktop: any;
  }
}
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/window-manager.ts src/main/ipc.ts src/preload/preload.ts src/renderer/global.d.ts
git commit -m "feat: frameless window, new IPC handlers, preload API"
```

---

