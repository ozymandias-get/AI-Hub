import { WebContentsView, shell } from 'electron';

/**
 * Protocols safe to open via shell.openExternal from a web context.
 * file: and unknown custom protocols are deliberately excluded.
 */
const SAFE_EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'tel:', 'sms:']);

import { getAllServices } from './services';

/** Exact hostnames and parent domains allowed inside the app view. */
const STATIC_ALLOWED_HOSTS = [
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
  'facebook.com',
  'x.com',
  'twitter.com',
  'auth0.com',
];

const TWO_PART_TLDS = new Set([
  'co.uk', 'org.uk', 'gov.uk', 'ac.uk',
  'com.tr', 'org.tr', 'gov.tr', 'edu.tr',
  'com.au', 'net.au', 'org.au',
  'co.jp', 'ne.jp',
  'co.kr',
  'com.br',
  'com.mx',
]);

function getRootDomain(hostname: string): string {
  const parts = hostname.toLowerCase().split('.');
  if (parts.length <= 2) {
    return hostname;
  }
  const lastTwo = parts.slice(-2).join('.');
  if (TWO_PART_TLDS.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

const ALLOWED_HOST_DOMAINS = new Set<string>();

// Initialize with static root domains
for (const host of STATIC_ALLOWED_HOSTS) {
  ALLOWED_HOST_DOMAINS.add(getRootDomain(host));
}

// Add root domains of all services
for (const svc of getAllServices()) {
  try {
    const parsed = new URL(svc.url);
    ALLOWED_HOST_DOMAINS.add(getRootDomain(parsed.hostname));
  } catch {
    // ignore invalid URLs
  }
}

function hostnameAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  const root = getRootDomain(host);
  return ALLOWED_HOST_DOMAINS.has(root) || ALLOWED_HOST_DOMAINS.has(host);
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
