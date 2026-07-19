import { Session } from 'electron';
import { isAllowedUrl } from './navigation-policy';

const configuredSessions = new WeakSet<Session>();

function isMediaOriginAllowed(origin: string): boolean {
  return isAllowedUrl(origin);
}

export function setupPermissions(ses: Session): void {
  if (configuredSessions.has(ses)) {
    return;
  }
  configuredSessions.add(ses);

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
