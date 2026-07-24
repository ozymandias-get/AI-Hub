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
import type { WindowSettings, AppSettings } from '../shared/types';
import { Logger } from '../shared/utils/logger';

export type { WindowSettings, AppSettings };

const LOG_TAG = 'SettingsStore';

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
      const rawSettings = fs.readFileSync(this.filePath, 'utf-8');
      const parsedSettings = JSON.parse(rawSettings) as Partial<AppSettings>;
      const windowSettings = { ...DEFAULT_SETTINGS.window, ...parsedSettings.window };
      windowSettings.zoomLevel = clampZoom(windowSettings.zoomLevel);
      return {
        window: windowSettings,
        minimizeToTray: parsedSettings.minimizeToTray ?? DEFAULT_SETTINGS.minimizeToTray,
        globalShortcut: parsedSettings.globalShortcut ?? DEFAULT_SETTINGS.globalShortcut,
        language: parsedSettings.language === 'tr' || parsedSettings.language === 'en' ? parsedSettings.language : DEFAULT_SETTINGS.language,
        autoLaunch: parsedSettings.autoLaunch ?? DEFAULT_SETTINGS.autoLaunch,
      };
    } catch (error: unknown) {
      const errorObj = error as { code?: string };
      if (errorObj?.code !== 'ENOENT') {
        Logger.warn(LOG_TAG, 'Settings file corrupted or unreadable, resetting to defaults', { error });
      }
    }
    return { ...DEFAULT_SETTINGS, window: { ...DEFAULT_SETTINGS.window } };
  }

  private async writeAsync(): Promise<void> {
    try {
      const filePath = this.filePath;
      const directory = path.dirname(filePath);
      await fs.promises.mkdir(directory, { recursive: true });
      await fs.promises.writeFile(filePath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (error) {
      Logger.error(LOG_TAG, 'Failed to save settings asynchronously', error);
    }
  }

  private writeSync(): void {
    try {
      const filePath = this.filePath;
      const directory = path.dirname(filePath);
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (error) {
      Logger.error(LOG_TAG, 'Failed to save settings synchronously', error);
    }
  }

  public save(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.writeAsync().catch((error) => {
        Logger.error(LOG_TAG, 'Unhandled exception writing settings asynchronously', error);
      });
    }, 200);
  }

  public saveSync(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.writeSync();
  }

  public get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  public set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings[key] = value;
  }

  public getWindow(): WindowSettings {
    return this.settings.window;
  }

  public setWindow(winSettings: Partial<WindowSettings>): void {
    const nextWindowSettings = { ...this.settings.window, ...winSettings };
    if (winSettings.zoomLevel !== undefined) {
      nextWindowSettings.zoomLevel = clampZoom(winSettings.zoomLevel);
    }
    this.settings.window = nextWindowSettings;
  }

  public resetWindow(): void {
    this.settings.window = { ...DEFAULT_SETTINGS.window };
  }
}
