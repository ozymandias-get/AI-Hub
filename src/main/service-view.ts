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
let currentLanguage: 'tr' | 'en' = 'tr';

export function setLanguage(lang: 'tr' | 'en'): void {
  currentLanguage = lang;
}

function getAcceptLanguage(): string {
  return currentLanguage === 'tr'
    ? 'tr-TR,tr;q=0.9,en-US,en;q=0.8'
    : 'en-US,en;q=0.9,tr-TR,tr;q=0.8';
}

function applyLanguageToSession(session: Electron.Session): void {
  session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Accept-Language'] = getAcceptLanguage();
    callback({ requestHeaders: details.requestHeaders });
  });
}


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
      backgroundThrottling: true,
      partition: `persist:service-${service.id}`,
    },
  });

  // Prevent white flash when loading or navigating sites
  view.setBackgroundColor('#08080a');

  setupNavigationPolicy(view);
  setupPermissions(view.webContents.session);
  setupDownloads(view.webContents.session);
  applyLanguageToSession(view.webContents.session);

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

export function goBack(win?: BrowserWindow, settings?: SettingsStore): void {
  if (currentView && !currentView.webContents.isDestroyed()) {
    const navHistory = currentView.webContents.navigationHistory;
    if (navHistory && navHistory.canGoBack()) {
      navHistory.goBack();
      return;
    }
  }

  if (win && settings) {
    showHomepage(win, settings);
  }
}

export function goForward(): void {
  if (currentView && !currentView.webContents.isDestroyed()) {
    const navHistory = currentView.webContents.navigationHistory;
    if (navHistory && navHistory.canGoForward()) {
      navHistory.goForward();
    }
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
    height: Math.max(0, contentBounds.height - TITLE_BAR_HEIGHT),
  });
}

export function switchToService(
  serviceId: string,
  win: BrowserWindow,
  settings: SettingsStore,
  customUrl?: string
): void {
  const service = getServiceById(serviceId) ?? getDefaultService();

  settings.setWindow({ lastService: service.id });
  settings.save();

  createServiceView(service);

  const view = currentView!;
  let viewAttached = false;

  view.webContents.on('did-start-loading', () => {
    if (win.isDestroyed()) return;
    win.setProgressBar(-1, { mode: 'indeterminate' });
    win.webContents.send('service-loading-start');
  });

  view.webContents.on('did-stop-loading', () => {
    if (win.isDestroyed()) return;
    win.setProgressBar(-1, { mode: 'none' });
    if (!viewAttached) {
      win.contentView.addChildView(view);
      resizeViewToWindow(win);
      viewAttached = true;
      view.webContents.focus();
    }
    win.webContents.send('service-loading-stop');
  });

  view.webContents.on('did-fail-load', (_event, errorCode, errorDescription, _validatedURL, isMainFrame) => {
    if (win.isDestroyed()) return;
    if (!isMainFrame || errorCode === -3) return;
    win.setProgressBar(-1, { mode: 'none' });
    if (viewAttached) {
      try { win.contentView.removeChildView(view); } catch {}
      viewAttached = false;
    }
    const errMsg = errorDescription || (currentLanguage === 'tr' ? 'Bilinmeyen hata' : 'Unknown error');
    win.webContents.send('service-loading-error', errMsg);
  });

  if (customUrl) {
    if (currentView && !currentView.webContents.isDestroyed()) {
      currentView.webContents.loadURL(customUrl);
      currentServiceId = service.id;
    }
  } else {
    loadServiceURL(service);
  }

  win.setTitle(`AI Hub - ${service.name}`);
  win.webContents.send('update-service-ui', {
    serviceId: service.id,
    name: service.name,
    isHome: false,
  });
}

export function showHomepage(win: BrowserWindow, settings: SettingsStore): void {
  if (currentView) {
    if (!win.isDestroyed()) {
      try {
        win.contentView.removeChildView(currentView);
      } catch (err) {
        // Not attached
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
  }
  currentServiceId = null;

  settings.setWindow({ lastService: '' });
  settings.save();

  if (!win.isDestroyed()) {
    win.setTitle('AI Hub');
    win.webContents.send('update-service-ui', {
      isHome: true,
    });
  }
}

/**
 * Detach the current view from all windows without destroying it.
 * The view stays alive in memory so it can be quickly re-attached.
 */
function detachCurrentView(): void {
  if (!currentView) return;
  const wins = BrowserWindow.getAllWindows();
  for (const win of wins) {
    if (!win.isDestroyed()) {
      try {
        win.contentView.removeChildView(currentView);
      } catch {
        // View may not be attached to this window
      }
    }
  }
}

export function suspendActiveService(): void {
  if (currentView && !currentView.webContents.isDestroyed()) {
    console.log('[ServiceView] Suspending active service (detach only, keeping in memory)');
    // Mute audio to save resources while hidden
    currentView.webContents.setAudioMuted(true);
    // Detach from window but keep alive — avoids full page reload on resume
    detachCurrentView();
  }
}

export function resumeActiveService(win: BrowserWindow, settings: SettingsStore): void {
  if (win.isDestroyed()) return;

  const lastServiceId = settings.getWindow().lastService;
  if (!lastServiceId) {
    showHomepage(win, settings);
    return;
  }

  // If the view is still alive and matches the expected service, re-attach it
  if (currentView && !currentView.webContents.isDestroyed() && currentServiceId === lastServiceId) {
    currentView.webContents.setAudioMuted(false);
    win.contentView.addChildView(currentView);
    resizeViewToWindow(win);
    currentView.webContents.focus();
    return;
  }

  // View was destroyed or service changed — fall back to full reload
  switchToService(lastServiceId, win, settings);
}
