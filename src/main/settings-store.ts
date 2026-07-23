import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import {
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_ZOOM_LEVEL,
  SETTINGS_FILENAME,
  ZOOM_MIN,
  ZOOM_MAX,
} from './constants';

export interface WindowSettings {
  width: number;
  height: number;
  x: number | undefined;
  y: number | undefined;
  isMaximized: boolean;
  /** Zoom factor (1.0 = 100%) */
  zoomLevel: number;
  lastService: string;
}

export interface AppSettings {
  window: WindowSettings;
  minimizeToTray: boolean;
  globalShortcut: string;
  language: 'tr' | 'en';
  autoLaunch: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  window: {
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    x: undefined,
    y: undefined,
    isMaximized: false,
    zoomLevel: DEFAULT_ZOOM_LEVEL,
    lastService: '',
  },
  minimizeToTray: false,
  globalShortcut: 'Alt+Space',
  language: 'tr',
  autoLaunch: false,
};

function clampZoom(factor: number): number {
  if (!Number.isFinite(factor)) {
    return DEFAULT_ZOOM_LEVEL;
  }
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor));
}

export class SettingsStore {
  private settings: AppSettings;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private cachedPath: string | null = null;

  constructor() {
    this.settings = this.load();
  }

  private get filePath(): string {
    if (!this.cachedPath) {
      this.cachedPath = path.join(app.getPath('userData'), SETTINGS_FILENAME);
    }
    return this.cachedPath;
  }

  private load(): AppSettings {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      const window = { ...DEFAULT_SETTINGS.window, ...parsed.window };
      window.zoomLevel = clampZoom(window.zoomLevel);
      return {
        window,
        minimizeToTray: parsed.minimizeToTray ?? DEFAULT_SETTINGS.minimizeToTray,
        globalShortcut: parsed.globalShortcut ?? DEFAULT_SETTINGS.globalShortcut,
        language: (parsed.language === 'tr' || parsed.language === 'en') ? parsed.language : DEFAULT_SETTINGS.language,
        autoLaunch: parsed.autoLaunch ?? DEFAULT_SETTINGS.autoLaunch,
      };
    } catch (err: any) {
      if (err?.code !== 'ENOENT') {
        console.warn('[SettingsStore] Settings file corrupted or unreadable, resetting to defaults:', err);
      }
    }
    return { ...DEFAULT_SETTINGS, window: { ...DEFAULT_SETTINGS.window } };
  }

  private async writeAsync(): Promise<void> {
    try {
      const filePath = this.filePath;
      const dir = path.dirname(filePath);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(filePath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err) {
      console.error('[SettingsStore] Failed to save settings asynchronously:', err);
    }
  }

  private writeSync(): void {
    try {
      const filePath = this.filePath;
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err) {
      console.error('[SettingsStore] Failed to save settings synchronously:', err);
    }
  }

  save(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.writeAsync().catch(() => {});
    }, 200);
  }

  saveSync(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.writeSync();
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings[key] = value;
  }

  getWindow(): WindowSettings {
    return this.settings.window;
  }

  setWindow(win: Partial<WindowSettings>): void {
    const next = { ...this.settings.window, ...win };
    if (win.zoomLevel !== undefined) {
      next.zoomLevel = clampZoom(win.zoomLevel);
    }
    this.settings.window = next;
  }

  resetWindow(): void {
    this.settings.window = { ...DEFAULT_SETTINGS.window };
  }
}
