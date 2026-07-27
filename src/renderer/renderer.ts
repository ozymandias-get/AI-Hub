import type { AIServiceCategory, Language, TabsState } from '../shared/types';
import type { ViewMode } from './types';
import {
  t,
  setCurrentLanguage,
  getCurrentLanguage,
  rebuildDescriptionsLower,
} from './services/i18n-service';
import { loadFavorites, saveFavorites, saveLanguage, loadLastOpenedMap, recordServiceOpened } from './services/storage-service';
import { TitlebarComponent } from './components/titlebar-component';
import { TabsComponent } from './components/tabs-component';
import { DashboardComponent } from './features/dashboard/dashboard-component';
import { SettingsComponent } from './features/settings/settings-component';
import { OverlayComponent } from './components/overlay-component';
import { IpcClientService } from './services/ipc-client';
import { Logger } from '../shared/utils/logger';

const LOG_TAG = 'RendererBootstrap';

let currentViewMode: ViewMode = 'home';
let currentServiceId: string | null = null;
let favorites: Set<string> = new Set();
let categories: AIServiceCategory[] = [];

window.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const dashboardView = document.getElementById('dashboard-view');
  const settingsView = document.getElementById('settings-view');
  const categoriesBar = document.getElementById('categories-bar');
  const servicesGrid = document.getElementById('services-grid');
  const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  const shortcutSelect = document.getElementById('shortcut-select') as HTMLSelectElement | null;
  const autolaunchSelect = document.getElementById('autolaunch-select') as HTMLSelectElement | null;
  const languageSelect = document.getElementById('language-select') as HTMLSelectElement | null;
  const categorySelect = document.getElementById('category-select') as HTMLSelectElement | null;
  const serviceSelect = document.getElementById('service-select') as HTMLSelectElement | null;
  const tabsList = document.getElementById('tabs-list');
  const splashScreen = document.getElementById('splash-screen');
  const splashSubtitle = document.getElementById('splash-subtitle');
  const splashStatus = document.getElementById('splash-status');
  const errorScreen = document.getElementById('error-screen');
  const errorMessage = document.getElementById('error-message');
  const retryButton = document.getElementById('retry-button');

  if (
    !dashboardView ||
    !settingsView ||
    !categoriesBar ||
    !servicesGrid ||
    !searchInput ||
    !shortcutSelect ||
    !autolaunchSelect ||
    !languageSelect ||
    !categorySelect ||
    !serviceSelect ||
    !tabsList ||
    !splashScreen ||
    !splashSubtitle ||
    !splashStatus ||
    !errorScreen ||
    !errorMessage ||
    !retryButton
  ) {
    Logger.error(LOG_TAG, 'Critical DOM elements missing on initialization');
    return;
  }

  // 1. Storage & Language initialization
  favorites = loadFavorites();

  try {
    const savedLanguage = await IpcClientService.getLanguage();
    if (savedLanguage === 'en' || savedLanguage === 'tr') {
      setCurrentLanguage(savedLanguage);
    }
  } catch (error) {
    Logger.warn(LOG_TAG, 'Failed to load language setting', { error });
  }

  // 2. Initialize Overlay Component
  const overlayComponent = new OverlayComponent(
    splashScreen,
    splashSubtitle,
    splashStatus,
    errorScreen,
    errorMessage,
    retryButton,
    {
      onRetry: (serviceId) => {
        if (serviceId) {
          launchService(serviceId);
        } else {
          IpcClientService.retryLoad();
        }
      },
    }
  );

  // 3. Initialize Dashboard Component
  const dashboardComponent = new DashboardComponent(
    categoriesBar,
    servicesGrid,
    searchInput,
    categorySelect,
    serviceSelect,
    {
      onLaunchService: (serviceId, openInNewTab) => launchService(serviceId, openInNewTab),
      onToggleFavorite: (serviceId, buttonElement) => {
        if (favorites.has(serviceId)) {
          favorites.delete(serviceId);
          buttonElement.classList.remove('active');
          buttonElement.title = t('favorite.add');
        } else {
          favorites.add(serviceId);
          buttonElement.classList.add('active');
          buttonElement.title = t('favorite.remove');
        }
        saveFavorites(favorites);
        dashboardComponent.updateFavorites(favorites);
      },
    }
  );

  // 4. Initialize Settings Component
  const settingsComponent = new SettingsComponent(
    shortcutSelect,
    autolaunchSelect,
    languageSelect,
    {
      onLanguageChange: (language: Language) => switchLanguage(language),
    }
  );

  // 5. Initialize Titlebar & Tabs Components
  const titlebarComponent = new TitlebarComponent({
    onHomeClick: () => showHomepageUI(),
    onSettingsClick: () => showSettingsUI(),
  });
  const tabsComponent = new TabsComponent(tabsList);

  let lastOpenedMap = loadLastOpenedMap();

  // View Switchers
  function launchService(serviceId: string, openInNewTab = false): void {
    currentServiceId = serviceId;
    overlayComponent.setCurrentServiceId(serviceId);
    overlayComponent.showSplash(serviceId);

    // Record last opened timestamp & refresh dashboard order
    lastOpenedMap = recordServiceOpened(serviceId);
    dashboardComponent.updateLastOpenedMap(lastOpenedMap);

    const serviceItem = categories
      .flatMap((categoryGroup) => categoryGroup.services)
      .find((service) => service.id === serviceId);
    if (serviceItem) {
      document.title = `${t('app.title')} - ${serviceItem.name}`;
      dashboardComponent.populateFallbackServices(serviceItem.category);
    }

    IpcClientService.openServiceInTab(serviceId, openInNewTab);
  }

  function showHomepageUI(): void {
    currentViewMode = 'home';
    currentServiceId = null;
    overlayComponent.setCurrentServiceId(null);
    titlebarComponent.setActiveNavButton('home');
    dashboardView?.classList.remove('hidden');
    settingsView?.classList.add('hidden');
    overlayComponent.hideAll();
    document.title = t('app.title');
  }

  function showSettingsUI(): void {
    currentViewMode = 'settings';
    currentServiceId = null;
    overlayComponent.setCurrentServiceId(null);
    titlebarComponent.setActiveNavButton('settings');
    dashboardView?.classList.add('hidden');
    settingsView?.classList.remove('hidden');
    overlayComponent.hideAll();
    document.title = `${t('app.title')} - ${t('settings.page.title')}`;
  }

  function switchToServiceUI(serviceId: string): void {
    currentViewMode = 'service';
    currentServiceId = serviceId;
    overlayComponent.setCurrentServiceId(serviceId);
    titlebarComponent.setActiveNavButton('none');
    dashboardView?.classList.add('hidden');
    settingsView?.classList.add('hidden');

    const serviceItem = categories
      .flatMap((categoryGroup) => categoryGroup.services)
      .find((service) => service.id === serviceId);
    if (serviceItem) {
      document.title = `${t('app.title')} - ${serviceItem.name}`;
      dashboardComponent.populateFallbackServices(serviceItem.category);
    }
  }

  function switchLanguage(language: Language): void {
    setCurrentLanguage(language);
    saveLanguage(language);
    IpcClientService.setLanguage(language);

    applyAllLanguageUpdates();
  }

  function applyAllLanguageUpdates(): void {
    rebuildDescriptionsLower();
    titlebarComponent.updateLanguage();
    dashboardComponent.updateLanguage();
    settingsComponent.updateLanguage();
    overlayComponent.updateLanguage();
  }

  // 6. Fetch Services & Populate
  try {
    categories = await IpcClientService.getServices();
    overlayComponent.setCategories(categories);
    dashboardComponent.setData(categories, favorites, lastOpenedMap);
  } catch (error) {
    Logger.error(LOG_TAG, 'Failed to load services', error);
  }

  await settingsComponent.initSettings(getCurrentLanguage());
  applyAllLanguageUpdates();

  // 7. Load Initial Tabs & Service State
  try {
    const tabsState: TabsState = await IpcClientService.getTabsState();
    if (tabsState) {
      tabsComponent.render(tabsState.tabs, tabsState.activeTabId);
    }
  } catch (error) {
    Logger.warn(LOG_TAG, 'Failed to fetch initial tabs state', { error });
  }

  try {
    const activeServiceId = await IpcClientService.getCurrentServiceId();
    if (activeServiceId) {
      switchToServiceUI(activeServiceId);
      const isServiceLoading = await IpcClientService.isServiceLoading();
      if (isServiceLoading) {
        overlayComponent.showSplash(activeServiceId);
      } else {
        overlayComponent.hideAll();
      }
    } else {
      showHomepageUI();
    }
  } catch (error) {
    Logger.error(LOG_TAG, 'Failed to load active service', error);
    showHomepageUI();
  }

  // 8. Bind IPC Event Listeners
  IpcClientService.onTabsUpdated((data) => {
    tabsComponent.render(data.tabs, data.activeTabId);
  });

  IpcClientService.onServiceLoadingStart(() => {
    overlayComponent.showSplash();
  });

  IpcClientService.onServiceLoadingStop(() => {
    overlayComponent.hideSplash();
  });

  IpcClientService.onServiceLoadingError((errorDescription: string) => {
    overlayComponent.showError(errorDescription);
  });

  IpcClientService.onUpdateServiceUI((info) => {
    if (info.isHome) {
      if (currentViewMode === 'settings') {
        showSettingsUI();
      } else {
        showHomepageUI();
      }
    } else if (info.serviceId) {
      switchToServiceUI(info.serviceId);
      overlayComponent.updateSplashLogo(info.serviceId);
    }
  });
});
