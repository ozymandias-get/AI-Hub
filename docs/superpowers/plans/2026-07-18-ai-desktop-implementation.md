# AI Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename "ChatGPT Desktop" to "AI Desktop" and add 49 AI services with category-based dropdown switching, single active model.

**Architecture:** Electron main process owns a single `WebContentsView`. Renderer draws a custom title bar with category+service dropdowns. IPC bridges service selection. Settings persist last active service.

**Tech Stack:** Electron 43+, TypeScript 7+, vanilla HTML/CSS/JS renderer.

## Global Constraints

- Only one `WebContentsView` active at any time
- Window title format: `AI Desktop - {Service Name}`
- All URLs use `https://`
- Frame-less window with custom title bar
- Service data defined in `src/main/services.ts`
- Last active service persisted in settings

---

### Task 1: Services Data + Constants + Settings Schema

**Files:**
- Create: `src/main/services.ts`
- Modify: `src/main/constants.ts`
- Modify: `src/main/settings-store.ts`

**Interfaces:**
- Consumes: Nothing
- Produces: `AIService` type, `SERVICE_CATEGORIES` map, `getServiceById(id)` function, `getDefaultService()` function, `WindowSettings.lastService` field

- [ ] **Step 1: Create `src/main/services.ts`**

```typescript
export interface AIService {
  id: string;
  name: string;
  url: string;
  category: string;
}

export interface AIServiceCategory {
  name: string;
  key: string;
  services: AIService[];
}

export const SERVICE_CATEGORIES: AIServiceCategory[] = [
  {
    name: 'Sohbet',
    key: 'chat',
    services: [
      { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', category: 'chat' },
      { id: 'claude', name: 'Claude', url: 'https://claude.ai', category: 'chat' },
      { id: 'perplexity', name: 'Perplexity AI', url: 'https://www.perplexity.ai', category: 'chat' },
      { id: 'copilot', name: 'Microsoft Copilot', url: 'https://copilot.microsoft.com', category: 'chat' },
      { id: 'grok', name: 'Grok', url: 'https://grok.com', category: 'chat' },
      { id: 'deepseek', name: 'DeepSeek Chat', url: 'https://chat.deepseek.com', category: 'chat' },
      { id: 'poe', name: 'Poe', url: 'https://poe.com', category: 'chat' },
      { id: 'lechat', name: 'Mistral Le Chat', url: 'https://chat.mistral.ai', category: 'chat' },
      { id: 'metaai', name: 'Meta AI', url: 'https://www.meta.ai', category: 'chat' },
      { id: 'qwen', name: 'Qwen Chat', url: 'https://chat.qwen.ai', category: 'chat' },
      { id: 'huggingchat', name: 'HuggingChat', url: 'https://huggingface.co/chat', category: 'chat' },
      { id: 'youcom', name: 'You.com', url: 'https://you.com', category: 'chat' },
      { id: 'phind', name: 'Phind', url: 'https://www.phind.com', category: 'chat' },
      { id: 'blackbox', name: 'Blackbox AI', url: 'https://www.blackbox.ai', category: 'chat' },
      { id: 'genspark', name: 'Genspark', url: 'https://genspark.ai', category: 'chat' },
      { id: 'felo', name: 'Felo AI', url: 'https://felo.ai', category: 'chat' },
      { id: 'kimi', name: 'Kimi AI', url: 'https://kimi.ai', category: 'chat' },
      { id: 'pi', name: 'Pi AI', url: 'https://pi.ai', category: 'chat' },
      { id: 'characterai', name: 'Character.AI', url: 'https://character.ai', category: 'chat' },
      { id: 'janitorai', name: 'Janitor AI', url: 'https://janitorai.com', category: 'chat' },
      { id: 'chubai', name: 'Chub AI', url: 'https://chub.ai', category: 'chat' },
    ],
  },
  {
    name: 'Görsel',
    key: 'image',
    services: [
      { id: 'midjourney', name: 'Midjourney', url: 'https://www.midjourney.com', category: 'image' },
      { id: 'leonardo', name: 'Leonardo AI', url: 'https://leonardo.ai', category: 'image' },
      { id: 'ideogram', name: 'Ideogram', url: 'https://ideogram.ai', category: 'image' },
      { id: 'playground', name: 'Playground AI', url: 'https://playground.com', category: 'image' },
      { id: 'firefly', name: 'Adobe Firefly', url: 'https://firefly.adobe.com', category: 'image' },
      { id: 'flux', name: 'FLUX Playground', url: 'https://flux1.ai', category: 'image' },
    ],
  },
  {
    name: 'Video',
    key: 'video',
    services: [
      { id: 'runway', name: 'Runway', url: 'https://runwayml.com', category: 'video' },
      { id: 'pika', name: 'Pika', url: 'https://pika.art', category: 'video' },
      { id: 'kling', name: 'Kling AI', url: 'https://klingai.com', category: 'video' },
      { id: 'hailuo', name: 'Hailuo AI', url: 'https://hailuoai.video', category: 'video' },
      { id: 'luma', name: 'Luma AI', url: 'https://lumalabs.ai', category: 'video' },
    ],
  },
  {
    name: 'Ses/Video Sentez',
    key: 'audio',
    services: [
      { id: 'heygen', name: 'HeyGen', url: 'https://www.heygen.com', category: 'audio' },
      { id: 'synthesia', name: 'Synthesia', url: 'https://www.synthesia.io', category: 'audio' },
      { id: 'elevenlabs', name: 'ElevenLabs', url: 'https://elevenlabs.io', category: 'audio' },
      { id: 'suno', name: 'Suno', url: 'https://suno.com', category: 'audio' },
      { id: 'udio', name: 'Udio', url: 'https://udio.com', category: 'audio' },
    ],
  },
  {
    name: 'Kod',
    key: 'code',
    services: [
      { id: 'bolt', name: 'Bolt.new', url: 'https://bolt.new', category: 'code' },
      { id: 'lovable', name: 'Lovable', url: 'https://lovable.dev', category: 'code' },
      { id: 'replit', name: 'Replit', url: 'https://replit.com', category: 'code' },
      { id: 'cursor', name: 'Cursor', url: 'https://cursor.com', category: 'code' },
      { id: 'windsurf', name: 'Windsurf', url: 'https://windsurf.com', category: 'code' },
      { id: 'codeium', name: 'Codeium', url: 'https://codeium.com', category: 'code' },
      { id: 'tabnine', name: 'Tabnine', url: 'https://www.tabnine.com', category: 'code' },
      { id: 'devin', name: 'Devin', url: 'https://devin.ai', category: 'code' },
      { id: 'openhands', name: 'OpenHands', url: 'https://openhands.dev', category: 'code' },
      { id: 'manus', name: 'Manus AI', url: 'https://manus.im', category: 'code' },
    ],
  },
  {
    name: 'Sunum/Üretkenlik',
    key: 'productivity',
    services: [
      { id: 'gamma', name: 'Gamma', url: 'https://gamma.app', category: 'productivity' },
      { id: 'napkin', name: 'Napkin AI', url: 'https://napkin.ai', category: 'productivity' },
      { id: 'mem', name: 'Mem.ai', url: 'https://mem.ai', category: 'productivity' },
    ],
  },
];

export function getAllServices(): AIService[] {
  return SERVICE_CATEGORIES.flatMap(c => c.services);
}

export function getServiceById(id: string): AIService | undefined {
  return getAllServices().find(s => s.id === id);
}

export function getDefaultService(): AIService {
  return { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', category: 'chat' };
}
```

- [ ] **Step 2: Update `src/main/constants.ts`**

```typescript
export const MIN_WINDOW_WIDTH = 900;
export const MIN_WINDOW_HEIGHT = 600;
export const DEFAULT_WINDOW_WIDTH = 1280;
export const DEFAULT_WINDOW_HEIGHT = 850;

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 3.0;
export const ZOOM_STEP = 0.1;

export const RESIZE_DEBOUNCE_MS = 50;
export const LOADING_BAR_TIMEOUT_MS = 300;

export const SETTINGS_FILENAME = 'app-settings.json';
export const DEFAULT_ZOOM_LEVEL = 1.0;

export const APP_USER_MODEL_ID = 'com.local.aidesktop';

export const TITLE_BAR_HEIGHT = 38;
```

- [ ] **Step 3: Update `src/main/settings-store.ts`**

Add `lastService` to `WindowSettings` interface:

```typescript
export interface WindowSettings {
  width: number;
  height: number;
  x: number | undefined;
  y: number | undefined;
  isMaximized: boolean;
  zoomLevel: number;
  lastService: string;
}
```

Update `DEFAULT_SETTINGS`:
```typescript
const DEFAULT_SETTINGS: AppSettings = {
  window: {
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    x: undefined,
    y: undefined,
    isMaximized: false,
    zoomLevel: DEFAULT_ZOOM_LEVEL,
    lastService: 'chatgpt',
  },
  minimizeToTray: false,
};
```

Update `load()` method to handle `lastService`:
```typescript
const window = { ...DEFAULT_SETTINGS.window, ...parsed.window };
window.zoomLevel = clampZoom(window.zoomLevel);
```

- [ ] **Step 4: Run typecheck to verify**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/services.ts src/main/constants.ts src/main/settings-store.ts
git commit -m "feat: add services data, constants, settings schema"
```

---

### Task 2: Generalize View to Any Service

**Files:**
- Modify: `src/main/chatgpt-view.ts` (rename and refactor)

**Interfaces:**
- Consumes: `AIService` from services.ts
- Produces: `createServiceView(service: AIService): WebContentsView`, `loadServiceURL(view, service)`, `destroyCurrentView()`

- [ ] **Step 1: Rename and refactor `src/main/chatgpt-view.ts` to `src/main/service-view.ts`**

Replace entire file content:

```typescript
import { BrowserWindow, WebContentsView } from 'electron';
import { setupNavigationPolicy } from './navigation-policy';
import { setupPermissions } from './permissions';
import { setupDownloads } from './downloads';
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, DEFAULT_ZOOM_LEVEL, TITLE_BAR_HEIGHT } from './constants';
import type { SettingsStore } from './settings-store';
import { getServiceById, getDefaultService } from './services';
import type { AIService } from './services';

let currentView: WebContentsView | null = null;
let settingsRef: SettingsStore | null = null;
let currentServiceId: string | null = null;

export function getCurrentView(): WebContentsView | null {
  return currentView;
}

export function getCurrentServiceId(): string | null {
  return currentServiceId;
}

export function setSettingsStore(settings: SettingsStore): void {
  settingsRef = settings;
}

function destroyExistingView(): void {
  if (!currentView) return;

  const wins = BrowserWindow.getAllWindows();
  for (const win of wins) {
    if (!win.isDestroyed()) {
      try {
        win.contentView.removeChildView(currentView);
      } catch {
        // View may not be attached
      }
    }
  }

  try {
    const wc = currentView.webContents;
    if (!wc.isDestroyed()) {
      wc.close();
    }
  } catch (err) {
    console.warn('[ServiceView] Failed to close previous view:', err);
  }
  currentView = null;
  currentServiceId = null;
}

export function createServiceView(service: AIService): WebContentsView {
  destroyExistingView();

  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  setupNavigationPolicy(view);
  setupPermissions(view);
  setupDownloads(view);

  currentView = view;
  currentServiceId = service.id;
  return view;
}

export function loadServiceURL(service: AIService): void {
  if (currentView && !currentView.webContents.isDestroyed()) {
    currentView.webContents.loadURL(service.url);
    currentServiceId = service.id;
  }
}

export function reloadService(ignoreCache: boolean = false): void {
  if (currentView && !currentView.webContents.isDestroyed()) {
    if (ignoreCache) {
      currentView.webContents.reloadIgnoringCache();
    } else {
      currentView.webContents.reload();
    }
  }
}

export function goBack(): void {
  if (currentView && !currentView.webContents.isDestroyed() && currentView.webContents.navigationHistory.canGoBack()) {
    currentView.webContents.navigationHistory.goBack();
  }
}

export function goForward(): void {
  if (currentView && !currentView.webContents.isDestroyed() && currentView.webContents.navigationHistory.canGoForward()) {
    currentView.webContents.navigationHistory.goForward();
  }
}

function persistZoomFactor(factor: number): void {
  if (!settingsRef) return;
  settingsRef.setWindow({ zoomLevel: factor });
  settingsRef.save();
}

function applyZoomFactor(factor: number): void {
  if (!currentView || currentView.webContents.isDestroyed()) return;
  const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor));
  currentView.webContents.setZoomFactor(clamped);
  persistZoomFactor(clamped);
}

export function restoreZoomLevel(): void {
  if (!currentView || currentView.webContents.isDestroyed()) return;
  const factor = settingsRef?.getWindow().zoomLevel ?? DEFAULT_ZOOM_LEVEL;
  currentView.webContents.setZoomFactor(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor)));
}

export function zoomIn(): void {
  if (!currentView || currentView.webContents.isDestroyed()) return;
  const current = currentView.webContents.getZoomFactor();
  applyZoomFactor(current + ZOOM_STEP);
}

export function zoomOut(): void {
  if (!currentView || currentView.webContents.isDestroyed()) return;
  const current = currentView.webContents.getZoomFactor();
  applyZoomFactor(current - ZOOM_STEP);
}

export function zoomReset(): void {
  applyZoomFactor(DEFAULT_ZOOM_LEVEL);
}

export function resizeViewToWindow(win: BrowserWindow): void {
  if (!currentView || currentView.webContents.isDestroyed() || win.isDestroyed()) return;
  const contentBounds = win.getContentBounds();
  currentView.setBounds({
    x: 0,
    y: TITLE_BAR_HEIGHT,
    width: contentBounds.width,
    height: contentBounds.height - TITLE_BAR_HEIGHT,
  });
}

export function switchToService(serviceId: string, win: BrowserWindow, settings: SettingsStore): void {
  const service = getServiceById(serviceId) ?? getDefaultService();

  settings.setWindow({ lastService: service.id });
  settings.save();

  createServiceView(service);
  loadServiceURL(service);

  win.setTitle(`AI Desktop - ${service.name}`);
  const name = service.name.replace(/'/g, "\\'");
  win.webContents.executeJavaScript(
    `(() => {
      document.getElementById('titlebar-text')!.textContent = 'AI Desktop - ${name}';
      document.getElementById('splash-subtitle')!.textContent = '${name}';
      document.getElementById('service-select')!.value = '${service.id}';
      document.title = 'AI Desktop - ${name}';
    })();`
  ).catch(() => {});
}
```

- [ ] **Step 2: Update all imports across the project that reference `./chatgpt-view`**

Files to update: `main.ts`, `menu.ts`, `ipc.ts`

Change `from './chatgpt-view'` to `from './service-view'` and update function names:
- `getChatGPTView()` → `getCurrentView()`
- `createChatGPTView()` → `createServiceView(service)`
- `loadChatGPTURL()` → `loadServiceURL(service)`
- `reloadChatGPT()` → `reloadService()`

- [ ] **Step 3: Delete old `src/main/chatgpt-view.ts`**

- [ ] **Step 4: Run typecheck to verify**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/service-view.ts src/main/chatgpt-view.ts src/main/main.ts src/main/menu.ts src/main/ipc.ts
git commit -m "refactor: generalize chatgpt-view to service-view"
```

---

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
import { SERVICE_CATEGORIES } from './services';
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

### Task 4: Custom Title Bar (Renderer)

**Files:**
- Modify: `src/renderer/index.html`
- Modify: `src/renderer/renderer.ts`
- Modify: `src/renderer/styles.css`

**Interfaces:**
- Consumes: `window.aiDesktop` API from preload
- Produces: Title bar with category+service dropdown + window controls

- [ ] **Step 1: Update `src/renderer/index.html`**

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'">
  <title>AI Desktop</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <div id="titlebar" class="titlebar">
    <div class="titlebar-drag">
      <span class="titlebar-text">AI Desktop</span>
    </div>
    <div class="titlebar-controls">
      <select id="category-select" class="titlebar-select" aria-label="Kategori">
        <option value="">Kategori Seç</option>
      </select>
      <select id="service-select" class="titlebar-select" aria-label="Servis">
        <option value="">Servis Seç</option>
      </select>
      <div class="titlebar-btns">
        <button id="minimize-btn" class="titlebar-btn" title="Küçült">─</button>
        <button id="maximize-btn" class="titlebar-btn" title="Büyüt">□</button>
        <button id="close-btn" class="titlebar-btn titlebar-close" title="Kapat">✕</button>
      </div>
    </div>
  </div>

  <div id="content-area" class="content-area">
    <div id="splash-screen" class="active">
      <div class="splash-bg"></div>
      <div class="splash-content">
        <h1 class="splash-title">AI Desktop</h1>
        <p class="splash-subtitle" id="splash-subtitle">Yükleniyor...</p>
        <div class="splash-loader">
          <div class="splash-loader-track">
            <div class="splash-loader-bar"></div>
          </div>
        </div>
        <p class="splash-status" id="splash-status">Bağlanıyor...</p>
      </div>
    </div>

    <div id="error-screen" class="hidden">
      <div class="error-content">
        <h1>Bağlantı Hatası</h1>
        <p id="error-message">Servis yüklenirken bir hata oluştu.</p>
        <p class="error-hint">İnternet bağlantınızı kontrol edin veya farklı bir servis seçin.</p>
        <div class="error-actions">
          <button id="retry-button" class="btn btn-primary">Yeniden Dene</button>
        </div>
      </div>
    </div>
  </div>

  <script type="module" src="./renderer.js"></script>
</body>
</html>
```

- [ ] **Step 2: Update `src/renderer/renderer.ts`**

```typescript
const titlebarText = document.getElementById('titlebar-text')!;
const categorySelect = document.getElementById('category-select') as HTMLSelectElement;
const serviceSelect = document.getElementById('service-select') as HTMLSelectElement;
const splashScreen = document.getElementById('splash-screen')!;
const splashSubtitle = document.getElementById('splash-subtitle')!;
const splashStatus = document.getElementById('splash-status')!;
const errorScreen = document.getElementById('error-screen')!;
const errorMessage = document.getElementById('error-message')!;
const retryButton = document.getElementById('retry-button')!;

interface AIService {
  id: string;
  name: string;
  url: string;
  category: string;
}

interface AIServiceCategory {
  name: string;
  key: string;
  services: AIService[];
}

let categories: AIServiceCategory[] = [];
let currentServiceId: string | null = null;

window.addEventListener('DOMContentLoaded', async () => {
  splashScreen.classList.add('active');

  const minimizeBtn = document.getElementById('minimize-btn')!;
  const maximizeBtn = document.getElementById('maximize-btn')!;
  const closeBtn = document.getElementById('close-btn')!;

  minimizeBtn.addEventListener('click', () => window.aiDesktop.minimize());
  maximizeBtn.addEventListener('click', () => window.aiDesktop.maximize());
  closeBtn.addEventListener('click', () => window.aiDesktop.close());

  categories = await window.aiDesktop.getServices();
  populateCategories();
});

function populateCategories(): void {
  categorySelect.innerHTML = '<option value="">Kategori Seç</option>';
  for (const cat of categories) {
    const option = document.createElement('option');
    option.value = cat.key;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  }

  categorySelect.addEventListener('change', () => {
    const key = categorySelect.value;
    populateServices(key);
  });

  serviceSelect.addEventListener('change', () => {
    const id = serviceSelect.value;
    if (id) {
      switchToService(id);
    }
  });
}

function populateServices(categoryKey: string): void {
  serviceSelect.innerHTML = '<option value="">Servis Seç</option>';
  const cat = categories.find(c => c.key === categoryKey);
  if (!cat) return;

  for (const svc of cat.services) {
    const option = document.createElement('option');
    option.value = svc.id;
    option.textContent = svc.name;
    serviceSelect.appendChild(option);
  }
}

function switchToService(serviceId: string): void {
  currentServiceId = serviceId;
  errorScreen.classList.add('hidden');
  splashScreen.classList.remove('done', 'hidden');
  splashScreen.classList.add('active');
  splashStatus.textContent = 'Bağlanıyor...';

  const svc = categories.flatMap(c => c.services).find(s => s.id === serviceId);
  if (svc) {
    splashSubtitle.textContent = svc.name;
    titlebarText.textContent = `AI Desktop - ${svc.name}`;
    document.title = `AI Desktop - ${svc.name}`;
  }

  window.aiDesktop.selectService(serviceId);
}

retryButton.addEventListener('click', () => {
  if (currentServiceId) {
    switchToService(currentServiceId);
  }
});
```

- [ ] **Step 3: Update `src/renderer/styles.css`**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  background: #1a1a2e;
  color: #fff;
}

/* Title Bar */
.titlebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 38px;
  background: #16213e;
  display: flex;
  align-items: center;
  padding: 0 8px;
  z-index: 1000;
  user-select: none;
}

.titlebar-drag {
  -webkit-app-region: drag;
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  padding-right: 12px;
}

.titlebar-text {
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.titlebar-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.titlebar-select {
  background: #0f3460;
  color: #e0e0e0;
  border: 1px solid #1a4a8a;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
  max-width: 160px;
}

.titlebar-select:hover {
  border-color: #2a6ab0;
}

.titlebar-select:focus {
  border-color: #4a90d9;
}

.titlebar-btns {
  display: flex;
  align-items: center;
  margin-left: 4px;
}

.titlebar-btn {
  background: none;
  border: none;
  color: #a0a0a0;
  width: 36px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  font-family: 'Segoe UI', Arial, sans-serif;
  transition: background 0.15s, color 0.15s;
}

.titlebar-btn:hover {
  background: #2a2a4a;
  color: #fff;
}

.titlebar-close:hover {
  background: #e81123;
  color: #fff;
}

/* Content Area */
.content-area {
  position: absolute;
  top: 38px;
  left: 0;
  right: 0;
  bottom: 0;
}

/* Splash Screen */
#splash-screen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  z-index: 100;
  transition: opacity 0.4s ease;
}

#splash-screen.hidden {
  display: none;
}

#splash-screen.done {
  opacity: 0;
}

.splash-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, #16213e 0%, #1a1a2e 70%);
}

.splash-content {
  position: relative;
  text-align: center;
  z-index: 1;
}

.splash-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #4a90d9, #6c5ce7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.splash-subtitle {
  font-size: 14px;
  color: #888;
  margin-bottom: 24px;
}

.splash-loader {
  margin: 0 auto 12px;
  width: 200px;
}

.splash-loader-track {
  height: 3px;
  background: #2a2a4a;
  border-radius: 2px;
  overflow: hidden;
}

.splash-loader-bar {
  width: 30%;
  height: 100%;
  background: linear-gradient(90deg, #4a90d9, #6c5ce7);
  border-radius: 2px;
  animation: loader 1.5s ease-in-out infinite;
}

@keyframes loader {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

.splash-status {
  font-size: 12px;
  color: #666;
}

/* Error Screen */
#error-screen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  z-index: 100;
}

#error-screen.hidden {
  display: none;
}

.error-content {
  text-align: center;
  max-width: 400px;
  padding: 24px;
}

.error-content h1 {
  font-size: 22px;
  margin-bottom: 8px;
}

#error-message {
  color: #e74c3c;
  margin-bottom: 8px;
  font-size: 14px;
}

.error-hint {
  color: #888;
  font-size: 13px;
  margin-bottom: 20px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary {
  background: #4a90d9;
  color: #fff;
}

.btn-primary:hover {
  background: #357abd;
}

.btn-secondary {
  background: #2a2a4a;
  color: #e0e0e0;
}

.btn-secondary:hover {
  background: #3a3a5a;
}
```

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add src/renderer/index.html src/renderer/renderer.ts src/renderer/styles.css
git commit -m "feat: custom title bar with service dropdown"
```

---

### Task 5: Main Process Integration

**Files:**
- Modify: `src/main/main.ts`
- Modify: `src/main/menu.ts`
- Modify: `src/main/tray.ts`

- [ ] **Step 1: Rewrite `src/main/main.ts`**

```typescript
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { SettingsStore } from './settings-store';
import { createMainWindow, getMainWindow, ensureWindowVisible } from './window-manager';
import {
  createServiceView,
  loadServiceURL,
  setSettingsStore,
  restoreZoomLevel,
  resizeViewToWindow,
  getCurrentView,
  getCurrentServiceId,
} from './service-view';
import { getServiceById, getDefaultService, type AIService } from './services';
import { setupMenu } from './menu';
import { setupTray, destroyTray } from './tray';
import { registerIpcHandlers, setIpcSettings } from './ipc';
import { setQuitting, getIsQuitting } from './app-state';
import { RESIZE_DEBOUNCE_MS, LOADING_BAR_TIMEOUT_MS, TITLE_BAR_HEIGHT, APP_USER_MODEL_ID } from './constants';

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
    setIpcSettings(settings);
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

  const lastServiceId = settings.getWindow().lastService;
  const service = getServiceById(lastServiceId) ?? getDefaultService();

  let view: Electron.WebContentsView;
  try {
    view = createServiceView(service);
  } catch (err) {
    console.warn('[App] Failed to create service view:', err);
    win.webContents.executeJavaScript(
      `document.getElementById('error-message').textContent = 'Uygulama baslatilamadi: ${escapeForSingleQuotedJs(String(err))}'; document.getElementById('error-screen')?.classList.remove('hidden');`
    ).catch(() => {});
    return;
  }
  activeView = view;

  setupViewEvents(win, view, service);
  loadServiceURL(service);
  setupMenu(win, settings);
  restoreZoomLevel();
  setupTray();

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
    if (viewAdded && activeView === view && !win.isDestroyed()) {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeViewToWindow(win);
        resizeTimer = null;
      }, RESIZE_DEBOUNCE_MS);
    }
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
  win.webContents.executeJavaScript(
    `document.getElementById('maximize-btn')?.classList.toggle('is-maximized', ${win.isMaximized()});`
  ).catch(() => {});
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

function setupViewEvents(win: BrowserWindow, view: Electron.WebContentsView, service: AIService): void {
  view.webContents.on('did-start-loading', () => {
    if (win.isDestroyed()) return;
    win.setProgressBar(-1, { mode: 'indeterminate' });
    win.webContents.executeJavaScript(
      `(() => {
        if (window.__splashTimer) { clearTimeout(window.__splashTimer); window.__splashTimer = null; }
        document.getElementById('error-screen')?.classList.add('hidden');
        document.getElementById('splash-screen')?.classList.remove('done', 'hidden');
        document.getElementById('splash-screen')?.classList.add('active');
      })();`
    ).catch((err) => console.warn('Failed to show splash:', err));
  });

  view.webContents.on('did-stop-loading', () => {
    if (win.isDestroyed()) return;
    win.setProgressBar(-1, { mode: 'none' });
    if (!viewAdded && activeView === view) {
      win.contentView.addChildView(view);
      resizeViewToWindow(win);
      viewAdded = true;
      view.webContents.focus();
    }
    win.webContents.executeJavaScript(
      `(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('done');
        if (window.__splashTimer) clearTimeout(window.__splashTimer);
        window.__splashTimer = setTimeout(() => {
          if (splash) splash.classList.add('hidden');
          window.__splashTimer = null;
        }, ${LOADING_BAR_TIMEOUT_MS + 300});
      })();`
    ).catch((err) => console.warn('Failed to hide splash:', err));
  });

  view.webContents.on('did-fail-load', (_event, errorCode, errorDescription, _validatedURL, isMainFrame) => {
    if (win.isDestroyed()) return;
    if (!isMainFrame || errorCode === -3) return;

    win.setProgressBar(-1, { mode: 'none' });
    if (viewAdded && activeView === view) {
      try { win.contentView.removeChildView(view); } catch {}
      viewAdded = false;
    }

    const escaped = escapeForSingleQuotedJs(errorDescription || 'Bilinmeyen hata');
    win.webContents.executeJavaScript(
      `(() => {
        document.getElementById('splash-screen')?.classList.add('hidden');
        const msg = document.getElementById('error-message');
        if (msg) msg.textContent = '${escaped}';
        document.getElementById('error-screen')?.classList.remove('hidden');
      })();`
    ).catch((err) => console.warn('Failed to show error screen:', err));
  });
}
```

- [ ] **Step 2: Update `src/main/menu.ts`**

Replace "ChatGPT Ana Sayfası" with service-related items and add "Servisler" menu:

```typescript
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
```

- [ ] **Step 3: Update `src/main/tray.ts`**

```typescript
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
```

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/main/main.ts src/main/menu.ts src/main/tray.ts
git commit -m "feat: main process service switching integration"
```

---

### Task 6: App Rename

**Files:**
- Modify: `package.json`
- Modify: `electron-builder.yml`

- [ ] **Step 1: Update `package.json`**

```json
{
  "name": "ai-desktop",
  "version": "1.0.0",
  "description": "AI Desktop Application",
  "author": "AI Desktop",
  ...
}
```

- [ ] **Step 2: Update `electron-builder.yml`**

```yaml
appId: com.local.aidesktop
productName: AI Desktop
copyright: Copyright © 2026
...
nsis:
  ...
  shortcutName: AI Desktop
  ...
  artifactName: AI-Desktop-Setup-${version}.exe
```

- [ ] **Step 3: Run build to verify**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add package.json electron-builder.yml
git commit -m "chore: rename app to AI Desktop"
```
