import type { AIServiceCategory, Language, ServiceUIInfo, TabsState } from '../../shared/types';
import { Logger } from '../../shared/utils/logger';
import { normalizeError } from '../../shared/errors/app-error';

const LOG_TAG = 'IpcClientService';

export class IpcClientService {
  private static get api() {
    if (!window.aiDesktop) {
      const errorMsg = 'Electron IPC Bridge (window.aiDesktop) is not available';
      Logger.error(LOG_TAG, errorMsg);
      throw new Error(errorMsg);
    }
    return window.aiDesktop;
  }

  public static async getLanguage(): Promise<Language> {
    try {
      return await this.api.getLanguage();
    } catch (error) {
      Logger.error(LOG_TAG, 'Failed to fetch language via IPC', error);
      throw normalizeError(error, 'Failed to load language setting');
    }
  }

  public static setLanguage(language: Language): void {
    try {
      this.api.setLanguage(language);
    } catch (error) {
      Logger.error(LOG_TAG, 'Failed to set language via IPC', error);
    }
  }

  public static async getServices(): Promise<AIServiceCategory[]> {
    try {
      return await this.api.getServices();
    } catch (error) {
      Logger.error(LOG_TAG, 'Failed to fetch services via IPC', error);
      throw normalizeError(error, 'Failed to load services list');
    }
  }

  public static async getCurrentServiceId(): Promise<string | null> {
    try {
      return await this.api.getCurrentServiceId();
    } catch (error) {
      Logger.error(LOG_TAG, 'Failed to fetch current service ID via IPC', error);
      return null;
    }
  }

  public static async isServiceLoading(): Promise<boolean> {
    try {
      return await this.api.isServiceLoading();
    } catch (error) {
      Logger.error(LOG_TAG, 'Failed to check service loading state', error);
      return false;
    }
  }

  public static showHomepage(): void {
    this.api.showHomepage();
  }

  public static goBack(): void {
    this.api.goBack();
  }

  public static minimizeWindow(): void {
    this.api.minimize();
  }

  public static maximizeWindow(): void {
    this.api.maximize();
  }

  public static closeWindow(): void {
    this.api.close();
  }

  public static selectService(serviceId: string): void {
    this.api.selectService(serviceId);
  }

  public static retryLoad(): void {
    this.api.retryLoad();
  }

  public static openExternal(url: string): void {
    this.api.openExternal(url);
  }

  public static async getGlobalShortcut(): Promise<string> {
    try {
      return await this.api.getGlobalShortcut();
    } catch (error) {
      Logger.error(LOG_TAG, 'Failed to fetch global shortcut', error);
      return 'Alt+Space';
    }
  }

  public static setGlobalShortcut(shortcut: string): void {
    this.api.setGlobalShortcut(shortcut);
  }

  public static async getAutoLaunch(): Promise<boolean> {
    try {
      return await this.api.getAutoLaunch();
    } catch (error) {
      Logger.error(LOG_TAG, 'Failed to fetch autolaunch status', error);
      return false;
    }
  }

  public static setAutoLaunch(enabled: boolean): void {
    this.api.setAutoLaunch(enabled);
  }

  public static async getTabsState(): Promise<TabsState> {
    try {
      return await this.api.getTabsState();
    } catch (error) {
      Logger.error(LOG_TAG, 'Failed to fetch tabs state', error);
      return { tabs: [], activeTabId: null };
    }
  }

  public static createTab(serviceId?: string): void {
    this.api.createTab(serviceId);
  }

  public static switchTab(tabId: string): void {
    this.api.switchTab(tabId);
  }

  public static closeTab(tabId: string): void {
    this.api.closeTab(tabId);
  }

  public static openServiceInTab(serviceId: string, openInNewTab = false): void {
    this.api.openServiceInTab(serviceId, openInNewTab);
  }

  public static onTabsUpdated(callback: (data: TabsState) => void): () => void {
    return this.api.onTabsUpdated(callback);
  }

  public static onServiceLoadingStart(callback: () => void): () => void {
    return this.api.onServiceLoadingStart(callback);
  }

  public static onServiceLoadingStop(callback: () => void): () => void {
    return this.api.onServiceLoadingStop(callback);
  }

  public static onServiceLoadingError(callback: (errorDescription: string) => void): () => void {
    return this.api.onServiceLoadingError(callback);
  }

  public static onUpdateServiceUI(callback: (info: ServiceUIInfo) => void): () => void {
    return this.api.onUpdateServiceUI(callback);
  }

  public static onMaximizeState(callback: (isMaximized: boolean) => void): () => void {
    return this.api.onMaximizeState(callback);
  }
}
