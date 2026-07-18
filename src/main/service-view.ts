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
