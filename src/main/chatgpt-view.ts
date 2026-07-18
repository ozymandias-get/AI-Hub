import { BrowserWindow, WebContentsView } from 'electron';
import { setupNavigationPolicy } from './navigation-policy';
import { setupPermissions } from './permissions';
import { setupDownloads } from './downloads';
import { CHATGPT_URL, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, DEFAULT_ZOOM_LEVEL } from './constants';
import type { SettingsStore } from './settings-store';

let chatGPTView: WebContentsView | null = null;
let settingsRef: SettingsStore | null = null;

export function getChatGPTView(): WebContentsView | null {
  return chatGPTView;
}

export function setSettingsStore(settings: SettingsStore): void {
  settingsRef = settings;
}

function destroyExistingView(): void {
  if (!chatGPTView) {
    return;
  }

  const wins = BrowserWindow.getAllWindows();
  for (const win of wins) {
    if (!win.isDestroyed()) {
      try {
        win.contentView.removeChildView(chatGPTView);
      } catch {
        // View may not be attached to this window
      }
    }
  }

  try {
    const wc = chatGPTView.webContents;
    if (!wc.isDestroyed()) {
      wc.close();
    }
  } catch (err) {
    console.warn('[ChatGPTView] Failed to close previous view:', err);
  }
  chatGPTView = null;
}

export function createChatGPTView(): WebContentsView {
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

  chatGPTView = view;
  return view;
}

export function loadChatGPTURL(): void {
  navigateToChatGPT();
}

export function navigateToChatGPT(): void {
  if (chatGPTView && !chatGPTView.webContents.isDestroyed()) {
    chatGPTView.webContents.loadURL(CHATGPT_URL);
  }
}

export function reloadChatGPT(ignoreCache: boolean = false): void {
  if (chatGPTView && !chatGPTView.webContents.isDestroyed()) {
    if (ignoreCache) {
      chatGPTView.webContents.reloadIgnoringCache();
    } else {
      chatGPTView.webContents.reload();
    }
  }
}

export function goBack(): void {
  if (
    chatGPTView &&
    !chatGPTView.webContents.isDestroyed() &&
    chatGPTView.webContents.navigationHistory.canGoBack()
  ) {
    chatGPTView.webContents.navigationHistory.goBack();
  }
}

export function goForward(): void {
  if (
    chatGPTView &&
    !chatGPTView.webContents.isDestroyed() &&
    chatGPTView.webContents.navigationHistory.canGoForward()
  ) {
    chatGPTView.webContents.navigationHistory.goForward();
  }
}

function persistZoomFactor(factor: number): void {
  if (!settingsRef) {
    return;
  }
  settingsRef.setWindow({ zoomLevel: factor });
  settingsRef.save();
}

function applyZoomFactor(factor: number): void {
  if (!chatGPTView || chatGPTView.webContents.isDestroyed()) {
    return;
  }
  const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor));
  chatGPTView.webContents.setZoomFactor(clamped);
  persistZoomFactor(clamped);
}

export function restoreZoomLevel(): void {
  if (!chatGPTView || chatGPTView.webContents.isDestroyed()) {
    return;
  }
  const factor = settingsRef?.getWindow().zoomLevel ?? DEFAULT_ZOOM_LEVEL;
  chatGPTView.webContents.setZoomFactor(
    Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor))
  );
}

export function zoomIn(): void {
  if (!chatGPTView || chatGPTView.webContents.isDestroyed()) {
    return;
  }
  const current = chatGPTView.webContents.getZoomFactor();
  applyZoomFactor(current + ZOOM_STEP);
}

export function zoomOut(): void {
  if (!chatGPTView || chatGPTView.webContents.isDestroyed()) {
    return;
  }
  const current = chatGPTView.webContents.getZoomFactor();
  applyZoomFactor(current - ZOOM_STEP);
}

export function zoomReset(): void {
  applyZoomFactor(DEFAULT_ZOOM_LEVEL);
}
