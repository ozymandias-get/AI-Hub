export interface ServiceUIInfo {
  serviceId?: string;
  name?: string;
  isHome?: boolean;
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
  getLanguage(): Promise<string>;
  setLanguage(language: string): void;
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
