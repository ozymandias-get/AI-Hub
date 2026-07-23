import { BrowserWindow, WebContentsView } from 'electron';
import { setupNavigationPolicy } from './navigation-policy';
import { setupPermissions } from './permissions';
import { setupDownloads } from './downloads';
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, DEFAULT_ZOOM_LEVEL, TITLE_BAR_HEIGHT } from './constants';
import type { SettingsStore } from './settings-store';
import { getServiceById, getDefaultService } from './services';
import type { AIService } from './services';

export interface TabInfo {
  id: string;
  serviceId: string | null;
  name: string;
  isHome: boolean;
  isLoading: boolean;
}

export interface Tab {
  id: string;
  serviceId: string | null;
  name: string;
  view: WebContentsView | null;
  isHome: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  viewAttached: boolean;
}

let tabs: Tab[] = [];
let activeTabId: string | null = null;
let settingsRef: SettingsStore | null = null;
let currentLanguage: 'tr' | 'en' = 'tr';

export function setLanguage(lang: 'tr' | 'en'): void {
  currentLanguage = lang;
  for (const tab of tabs) {
    if (tab.isHome) {
      tab.name = lang === 'tr' ? 'Ana Sayfa' : 'Home';
    }
  }
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

export function setSettingsStore(settings: SettingsStore): void {
  settingsRef = settings;
}

export function getTabsInfo(): TabInfo[] {
  return tabs.map(t => ({
    id: t.id,
    serviceId: t.serviceId,
    name: t.name,
    isHome: t.isHome,
    isLoading: t.isLoading,
  }));
}

export function getActiveTabId(): string | null {
  return activeTabId;
}

export function getActiveTab(): Tab | null {
  if (!activeTabId) return null;
  return tabs.find(t => t.id === activeTabId) || null;
}

export function getCurrentView(): WebContentsView | null {
  const active = getActiveTab();
  return active ? active.view : null;
}

export function getCurrentServiceId(): string | null {
  const active = getActiveTab();
  return active ? active.serviceId : null;
}

export function notifyTabsUpdated(win?: BrowserWindow): void {
  const targetWin = win || (BrowserWindow.getAllWindows()[0] ?? null);
  if (targetWin && !targetWin.isDestroyed()) {
    targetWin.webContents.send('tabs-updated', {
      tabs: getTabsInfo(),
      activeTabId,
    });
  }
}

export function resizeViewToWindow(win: BrowserWindow): void {
  const active = getActiveTab();
  if (!active || !active.view || active.view.webContents.isDestroyed() || win.isDestroyed()) return;
  const contentBounds = win.getContentBounds();
  active.view.setBounds({
    x: 0,
    y: TITLE_BAR_HEIGHT,
    width: contentBounds.width,
    height: Math.max(0, contentBounds.height - TITLE_BAR_HEIGHT),
  });
}

function detachViewFromWindow(view: WebContentsView, win: BrowserWindow): void {
  if (!view || view.webContents.isDestroyed() || win.isDestroyed()) return;
  try {
    win.contentView.removeChildView(view);
  } catch {}
}

function sleepTab(tab: Tab, win: BrowserWindow): void {
  if (tab.view && !tab.view.webContents.isDestroyed()) {
    detachViewFromWindow(tab.view, win);
    tab.viewAttached = false;
    try {
      tab.view.webContents.setAudioMuted(true);
    } catch {}
  }
}

function wakeTab(tab: Tab, win: BrowserWindow): void {
  if (tab.view && !tab.view.webContents.isDestroyed()) {
    try {
      tab.view.webContents.setAudioMuted(false);
      if (!tab.viewAttached || !win.contentView.children.includes(tab.view)) {
        win.contentView.addChildView(tab.view);
        tab.viewAttached = true;
      }
      resizeViewToWindow(win);
      tab.view.webContents.focus();
    } catch (err) {
      console.warn('[ServiceView] Failed to wake tab:', err);
    }
  }
}

export function createTab(
  serviceId?: string,
  win?: BrowserWindow,
  settings?: SettingsStore,
  customUrl?: string
): string {
  const targetWin = win || (BrowserWindow.getAllWindows()[0] ?? null);
  const tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (!serviceId) {
    // Home Tab
    const homeTab: Tab = {
      id: tabId,
      serviceId: null,
      name: currentLanguage === 'tr' ? 'Ana Sayfa' : 'Home',
      view: null,
      isHome: true,
      isLoading: false,
      isLoaded: true,
      viewAttached: false,
    };
    tabs.push(homeTab);

    if (targetWin) {
      switchTab(tabId, targetWin, settings);
    } else {
      activeTabId = tabId;
    }
    return tabId;
  }

  // Service Tab
  const service = getServiceById(serviceId) ?? getDefaultService();

  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      backgroundThrottling: true,
      v8CacheOptions: 'bypassHeatCheck',
      spellcheck: false,
      partition: `persist:service-${service.id}`,
    },
  });

  view.setBackgroundColor('#08080a');
  setupNavigationPolicy(view);
  setupPermissions(view.webContents.session);
  setupDownloads(view.webContents.session);
  applyLanguageToSession(view.webContents.session);

  const newTab: Tab = {
    id: tabId,
    serviceId: service.id,
    name: service.name,
    view,
    isHome: false,
    isLoading: true,
    isLoaded: false,
    viewAttached: false,
  };

  view.webContents.on('did-start-loading', () => {
    newTab.isLoading = true;
    if (targetWin && !targetWin.isDestroyed()) {
      targetWin.setProgressBar(-1, { mode: 'indeterminate' });
      if (activeTabId === tabId) {
        targetWin.webContents.send('service-loading-start');
      }
      notifyTabsUpdated(targetWin);
    }
  });

  view.webContents.on('dom-ready', () => {
    newTab.isLoaded = true;
    if (targetWin && !targetWin.isDestroyed() && activeTabId === tabId) {
      if (!newTab.viewAttached || !targetWin.contentView.children.includes(view)) {
        targetWin.contentView.addChildView(view);
        resizeViewToWindow(targetWin);
        newTab.viewAttached = true;
        view.webContents.focus();
      }
      targetWin.webContents.send('service-loading-stop');
    }
  });

  view.webContents.on('did-stop-loading', () => {
    newTab.isLoading = false;
    newTab.isLoaded = true;
    if (targetWin && !targetWin.isDestroyed()) {
      targetWin.setProgressBar(-1, { mode: 'none' });
      if (activeTabId === tabId) {
        if (!newTab.viewAttached || !targetWin.contentView.children.includes(view)) {
          targetWin.contentView.addChildView(view);
          resizeViewToWindow(targetWin);
          newTab.viewAttached = true;
          view.webContents.focus();
        }
        targetWin.webContents.send('service-loading-stop');
      }
      notifyTabsUpdated(targetWin);
    }
  });

  view.webContents.on('did-fail-load', (_event, errorCode, errorDescription, _validatedURL, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) return;
    newTab.isLoading = false;
    if (targetWin && !targetWin.isDestroyed()) {
      targetWin.setProgressBar(-1, { mode: 'none' });
      if (activeTabId === tabId) {
        const errMsg = errorDescription || (currentLanguage === 'tr' ? 'Bilinmeyen hata' : 'Unknown error');
        targetWin.webContents.send('service-loading-error', errMsg);
      }
      notifyTabsUpdated(targetWin);
    }
  });

  tabs.push(newTab);

  const urlToLoad = customUrl || service.url;
  view.webContents.loadURL(urlToLoad);

  if (targetWin) {
    switchTab(tabId, targetWin, settings);
  } else {
    activeTabId = tabId;
  }

  return tabId;
}

export function switchTab(tabId: string, win: BrowserWindow, settings?: SettingsStore): void {
  if (win.isDestroyed()) return;

  const targetTab = tabs.find(t => t.id === tabId);
  if (!targetTab) return;

  // Sleep previous active tab if switching away
  if (activeTabId && activeTabId !== tabId) {
    const currentActive = tabs.find(t => t.id === activeTabId);
    if (currentActive) {
      sleepTab(currentActive, win);
    }
  }

  activeTabId = tabId;

  if (settings && targetTab.serviceId) {
    settings.setWindow({ lastService: targetTab.serviceId });
    settings.save();
  } else if (settings && targetTab.isHome) {
    settings.setWindow({ lastService: '' });
    settings.save();
  }

  if (targetTab.isHome) {
    // Ensure no service views are attached when showing Home
    for (const t of tabs) {
      if (t.view && t.viewAttached) {
        detachViewFromWindow(t.view, win);
        t.viewAttached = false;
      }
    }
    win.setTitle('AI Hub');
    win.webContents.send('update-service-ui', { isHome: true });
    win.webContents.send('service-loading-stop');
  } else {
    win.setTitle(`AI Hub - ${targetTab.name}`);
    win.webContents.send('update-service-ui', {
      serviceId: targetTab.serviceId,
      name: targetTab.name,
      isHome: false,
    });

    if (targetTab.isLoaded && !targetTab.isLoading) {
      // Already loaded! Wake tab view immediately and hide splash
      wakeTab(targetTab, win);
      win.webContents.send('service-loading-stop');
    } else {
      // Still loading! Keep view detached so splash screen on DOM is visible
      if (targetTab.view && targetTab.viewAttached) {
        detachViewFromWindow(targetTab.view, win);
        targetTab.viewAttached = false;
      }
      win.webContents.send('service-loading-start');
    }
  }

  notifyTabsUpdated(win);
}

export function closeTab(tabId: string, win: BrowserWindow, settings?: SettingsStore): void {
  if (win.isDestroyed()) return;

  const index = tabs.findIndex(t => t.id === tabId);
  if (index === -1) return;

  const tabToClose = tabs[index];

  if (tabToClose.view) {
    try {
      win.contentView.removeChildView(tabToClose.view);
    } catch {}
    try {
      if (!tabToClose.view.webContents.isDestroyed()) {
        tabToClose.view.webContents.close();
      }
    } catch (err) {
      console.warn('[ServiceView] Failed to close webContents:', err);
    }
    tabToClose.view = null;
  }

  tabs.splice(index, 1);

  if (tabs.length === 0) {
    createTab(undefined, win, settings);
  } else if (activeTabId === tabId) {
    const nextIndex = Math.max(0, index - 1);
    switchTab(tabs[nextIndex].id, win, settings);
  } else {
    notifyTabsUpdated(win);
  }
}

export function openServiceInTab(
  serviceId: string,
  win: BrowserWindow,
  settings: SettingsStore,
  openInNewTab: boolean = false
): void {
  const active = getActiveTab();

  if (active && active.isHome && !openInNewTab) {
    // Reuse current Home tab for this service
    const service = getServiceById(serviceId) ?? getDefaultService();

    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        backgroundThrottling: true,
        v8CacheOptions: 'bypassHeatCheck',
        spellcheck: false,
        partition: `persist:service-${service.id}`,
      },
    });

    view.setBackgroundColor('#08080a');
    setupNavigationPolicy(view);
    setupPermissions(view.webContents.session);
    setupDownloads(view.webContents.session);
    applyLanguageToSession(view.webContents.session);

    active.isHome = false;
    active.serviceId = service.id;
    active.name = service.name;
    active.view = view;
    active.isLoading = true;
    active.isLoaded = false;
    active.viewAttached = false;

    view.webContents.on('did-start-loading', () => {
      active.isLoading = true;
      if (!win.isDestroyed()) {
        win.setProgressBar(-1, { mode: 'indeterminate' });
        if (activeTabId === active.id) {
          win.webContents.send('service-loading-start');
        }
        notifyTabsUpdated(win);
      }
    });

    view.webContents.on('dom-ready', () => {
      active.isLoaded = true;
      if (!win.isDestroyed() && activeTabId === active.id) {
        if (!active.viewAttached || !win.contentView.children.includes(view)) {
          win.contentView.addChildView(view);
          resizeViewToWindow(win);
          active.viewAttached = true;
          view.webContents.focus();
        }
        win.webContents.send('service-loading-stop');
      }
    });

    view.webContents.on('did-stop-loading', () => {
      active.isLoading = false;
      active.isLoaded = true;
      if (!win.isDestroyed()) {
        win.setProgressBar(-1, { mode: 'none' });
        if (activeTabId === active.id) {
          if (!active.viewAttached || !win.contentView.children.includes(view)) {
            win.contentView.addChildView(view);
            resizeViewToWindow(win);
            active.viewAttached = true;
            view.webContents.focus();
          }
          win.webContents.send('service-loading-stop');
        }
        notifyTabsUpdated(win);
      }
    });

    view.webContents.on('did-fail-load', (_event, errorCode, errorDescription, _validatedURL, isMainFrame) => {
      if (!isMainFrame || errorCode === -3) return;
      active.isLoading = false;
      if (!win.isDestroyed()) {
        win.setProgressBar(-1, { mode: 'none' });
        if (activeTabId === active.id) {
          const errMsg = errorDescription || (currentLanguage === 'tr' ? 'Bilinmeyen hata' : 'Unknown error');
          win.webContents.send('service-loading-error', errMsg);
        }
        notifyTabsUpdated(win);
      }
    });

    view.webContents.loadURL(service.url);
    switchTab(active.id, win, settings);
  } else {
    createTab(serviceId, win, settings);
  }
}

export function showHomepage(win: BrowserWindow, settings: SettingsStore): void {
  const homeTab = tabs.find(t => t.isHome);
  if (homeTab) {
    switchTab(homeTab.id, win, settings);
  } else {
    createTab(undefined, win, settings);
  }
}

export function reloadService(ignoreCache: boolean = false): void {
  const active = getActiveTab();
  if (active && active.view && !active.view.webContents.isDestroyed()) {
    active.isLoading = true;
    active.isLoaded = false;
    if (ignoreCache) {
      active.view.webContents.reloadIgnoringCache();
    } else {
      active.view.webContents.reload();
    }
  }
}

export function loadServiceURL(service: AIService): void {
  const active = getActiveTab();
  if (active && active.view && !active.view.webContents.isDestroyed()) {
    active.isLoading = true;
    active.isLoaded = false;
    active.view.webContents.loadURL(service.url);
    active.serviceId = service.id;
    active.name = service.name;
    notifyTabsUpdated();
  }
}

export function goBack(win?: BrowserWindow, settings?: SettingsStore): void {
  const active = getActiveTab();
  if (active && active.view && !active.view.webContents.isDestroyed()) {
    const navHistory = active.view.webContents.navigationHistory;
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
  const active = getActiveTab();
  if (active && active.view && !active.view.webContents.isDestroyed()) {
    const navHistory = active.view.webContents.navigationHistory;
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
  const active = getActiveTab();
  if (!active || !active.view || active.view.webContents.isDestroyed()) return;
  const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor));
  active.view.webContents.setZoomFactor(clamped);
  persistZoomFactor(clamped);
}

export function restoreZoomLevel(): void {
  const active = getActiveTab();
  if (!active || !active.view || active.view.webContents.isDestroyed()) return;
  const factor = settingsRef?.getWindow().zoomLevel ?? DEFAULT_ZOOM_LEVEL;
  active.view.webContents.setZoomFactor(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor)));
}

export function zoomIn(): void {
  const active = getActiveTab();
  if (!active || !active.view || active.view.webContents.isDestroyed()) return;
  const current = active.view.webContents.getZoomFactor();
  applyZoomFactor(current + ZOOM_STEP);
}

export function zoomOut(): void {
  const active = getActiveTab();
  if (!active || !active.view || active.view.webContents.isDestroyed()) return;
  const current = active.view.webContents.getZoomFactor();
  applyZoomFactor(current - ZOOM_STEP);
}

export function zoomReset(): void {
  applyZoomFactor(DEFAULT_ZOOM_LEVEL);
}

export function suspendActiveService(): void {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win || win.isDestroyed()) return;

  for (const tab of tabs) {
    if (tab.view && !tab.view.webContents.isDestroyed()) {
      sleepTab(tab, win);
    }
  }
}

export function resumeActiveService(win: BrowserWindow, settings: SettingsStore): void {
  if (win.isDestroyed()) return;

  const active = getActiveTab();
  if (active) {
    if (active.isHome) {
      showHomepage(win, settings);
    } else if (active.view && !active.view.webContents.isDestroyed()) {
      if (active.isLoaded) {
        wakeTab(active, win);
      }
    }
  } else {
    showHomepage(win, settings);
  }
}
