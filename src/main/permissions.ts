import { WebContentsView, session } from 'electron';
import { CHATGPT_URL } from './constants';

const CHATGPT_ORIGIN = new URL(CHATGPT_URL).origin;

const ALLOWED_MEDIA_HOSTS = [
  'chatgpt.com',
  'chat.openai.com',
  'openai.com',
];

let permissionHandlersInstalled = false;

function isMediaOriginAllowed(origin: string): boolean {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return ALLOWED_MEDIA_HOSTS.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    );
  } catch {
    return origin === CHATGPT_ORIGIN;
  }
}

export function setupPermissions(_view: WebContentsView): void {
  if (permissionHandlersInstalled) {
    return;
  }
  permissionHandlersInstalled = true;

  const ses = session.defaultSession;

  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();
    let origin: string;
    try {
      origin = new URL(url).origin;
    } catch {
      callback(false);
      return;
    }

    if (permission === 'media' && isMediaOriginAllowed(origin)) {
      callback(true);
      return;
    }

    if (permission === 'clipboard-read' || permission === 'clipboard-sanitized-write') {
      callback(true);
      return;
    }

    callback(false);
  });

  ses.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => {
    if (permission === 'media' && isMediaOriginAllowed(requestingOrigin)) {
      return true;
    }
    if (permission === 'clipboard-read' || permission === 'clipboard-sanitized-write') {
      return true;
    }
    return false;
  });
}
