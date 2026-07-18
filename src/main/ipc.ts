import { ipcMain, shell } from 'electron';
import { getChatGPTView } from './chatgpt-view';
import { CHATGPT_URL } from './constants';
import { isAllowedUrl } from './navigation-policy';

let ipcRegistered = false;

function isSafeExternalUrl(url: unknown): url is string {
  if (typeof url !== 'string') {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function registerIpcHandlers(): void {
  if (ipcRegistered) {
    return;
  }
  ipcRegistered = true;

  ipcMain.on('retry-load', () => {
    const view = getChatGPTView();
    if (view && !view.webContents.isDestroyed()) {
      view.webContents.loadURL(CHATGPT_URL);
    }
  });

  ipcMain.on('open-external', (_event, url: unknown) => {
    if (!isSafeExternalUrl(url)) {
      return;
    }
    // Allow any http(s) URL for intentional "open in browser" actions
    shell.openExternal(url).catch((err) => console.warn('Failed to open external URL:', err));
  });
}

/** Re-export for callers that need policy checks elsewhere. */
export { isAllowedUrl };
