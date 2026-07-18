import { WebContentsView, shell } from 'electron';

/**
 * Protocols safe to open via shell.openExternal from a web context.
 * file: and unknown custom protocols are deliberately excluded.
 */
const SAFE_EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'tel:', 'sms:']);

/** Exact hostnames and parent domains allowed inside the app view. */
const ALLOWED_HOSTS = [
  'chatgpt.com',
  'chat.openai.com',
  'auth.openai.com',
  'login.openai.com',
  'openai.com',
  'platform.openai.com',
  'cdn.openai.com',
  'ab.chatgpt.com',
  // OAuth / SSO
  'accounts.google.com',
  'appleid.apple.com',
  'login.microsoftonline.com',
  'login.live.com',
  'github.com',
];

function hostnameAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
}

export function isAllowedUrl(url: string): boolean {
  if (!url || url === 'about:blank') {
    return true;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'about:') {
      return true;
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    return hostnameAllowed(parsed.hostname);
  } catch {
    return false;
  }
}

export function setupNavigationPolicy(view: WebContentsView): void {
  const webContents = view.webContents;

  webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedUrl(url)) {
      return { action: 'allow' };
    }
    try {
      const protocol = new URL(url).protocol;
      if (SAFE_EXTERNAL_PROTOCOLS.has(protocol)) {
        shell.openExternal(url).catch((err) => console.warn('Failed to open external URL:', err));
      }
    } catch {
      // Invalid URL — ignore entirely
    }
    return { action: 'deny' };
  });

  webContents.on('will-navigate', (event, url) => {
    if (!isAllowedUrl(url)) {
      event.preventDefault();
      try {
        const protocol = new URL(url).protocol;
        if (SAFE_EXTERNAL_PROTOCOLS.has(protocol)) {
          shell.openExternal(url).catch((err) => console.warn('Failed to open external URL:', err));
        }
      } catch {
        // Invalid URL — ignore entirely
      }
    }
  });
}
