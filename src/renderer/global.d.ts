export interface ServiceUIInfo {
  serviceId?: string;
  name?: string;
  isHome?: boolean;
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

export interface AiDesktopAPI {
  getServices(): Promise<any[]>;
  getCurrentServiceId(): Promise<string>;
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
  getLanguage(): Promise<string>;
  setLanguage(language: string): void;
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
