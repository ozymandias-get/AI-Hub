import type { AIServiceCategory, ServiceUIInfo, TabInfo, TabsState, Language } from '../shared/types';

export type { ServiceUIInfo, TabInfo, TabsState };

export interface AiDesktopAPI {
  getServices(): Promise<AIServiceCategory[]>;
  getCurrentServiceId(): Promise<string | null>;
  isServiceLoading(): Promise<boolean>;
  showHomepage(): void;
  goBack(): void;
  minimize(): void;
  maximize(): void;
  close(): void;
  selectService(id: string): void;
  retryLoad(): void;
  openExternal(url: string): void;
  getGlobalShortcut(): Promise<string>;
  setGlobalShortcut(shortcut: string): void;
  getAutoLaunch(): Promise<boolean>;
  setAutoLaunch(enabled: boolean): void;
  getLanguage(): Promise<Language>;
  setLanguage(language: Language): void;
  getTabsState(): Promise<TabsState>;
  createTab(serviceId?: string): void;
  switchTab(tabId: string): void;
  closeTab(tabId: string): void;
  openServiceInTab(serviceId: string, openInNewTab?: boolean): void;
  onTabsUpdated(callback: (data: TabsState) => void): () => void;
  onServiceLoadingStart(callback: () => void): () => void;
  onServiceLoadingStop(callback: () => void): () => void;
  onServiceLoadingError(callback: (errorDescription: string) => void): () => void;
  onUpdateServiceUI(callback: (info: ServiceUIInfo) => void): () => void;
  onMaximizeState(callback: (isMaximized: boolean) => void): () => void;
}

declare global {
  interface Window {
    aiDesktop: AiDesktopAPI;
  }
}
