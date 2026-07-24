export type Language = 'tr' | 'en';

export interface AIService {
  id: string;
  name: string;
  url: string;
  category: string;
}

export interface AIServiceCategory {
  name: string;
  key: string;
  services: AIService[];
}

export interface TabInfo {
  id: string;
  serviceId: string | null;
  name: string;
  isHome: boolean;
  isLoading: boolean;
}

export interface TabsState {
  tabs: TabInfo[];
  activeTabId: string | null;
}

export interface ServiceUIInfo {
  serviceId?: string | null;
  name?: string;
  isHome: boolean;
}

export interface WindowSettings {
  width: number;
  height: number;
  x: number | undefined;
  y: number | undefined;
  isMaximized: boolean;
  zoomLevel: number;
  lastService: string;
}

export interface AppSettings {
  window: WindowSettings;
  minimizeToTray: boolean;
  globalShortcut: string;
  language: Language;
  autoLaunch: boolean;
}

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  cause?: unknown;
  context?: Record<string, unknown>;
  retryable: boolean;
}
