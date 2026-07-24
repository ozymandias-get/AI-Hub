import type { Language } from '../../../shared/types';
import { t } from '../../services/i18n-service';
import { Logger } from '../../../shared/utils/logger';
import { IpcClientService } from '../../services/ipc-client';

const LOG_TAG = 'SettingsComponent';

export interface SettingsCallbacks {
  onLanguageChange: (lang: Language) => void;
}

export class SettingsComponent {
  private readonly shortcutSelect: HTMLSelectElement;
  private readonly autolaunchSelect: HTMLSelectElement;
  private readonly languageSelect: HTMLSelectElement;
  private readonly callbacks: SettingsCallbacks;

  constructor(
    shortcutSelect: HTMLSelectElement,
    autolaunchSelect: HTMLSelectElement,
    languageSelect: HTMLSelectElement,
    callbacks: SettingsCallbacks
  ) {
    this.shortcutSelect = shortcutSelect;
    this.autolaunchSelect = autolaunchSelect;
    this.languageSelect = languageSelect;
    this.callbacks = callbacks;

    this.bindEvents();
  }

  public async initSettings(currentLanguage: Language): Promise<void> {
    if (this.languageSelect) {
      this.languageSelect.value = currentLanguage;
    }

    try {
      const activeShortcut = await IpcClientService.getGlobalShortcut();
      if (this.shortcutSelect) {
        this.shortcutSelect.value = activeShortcut;
      }
    } catch (error) {
      Logger.warn(LOG_TAG, 'Failed to load global shortcut setting', { error });
    }

    try {
      const isAutoLaunch = await IpcClientService.getAutoLaunch();
      if (this.autolaunchSelect) {
        this.autolaunchSelect.value = String(isAutoLaunch);
      }
    } catch (error) {
      Logger.warn(LOG_TAG, 'Failed to load auto launch setting', { error });
    }
  }

  public updateLanguage(): void {
    const settingsViewTitle = document.getElementById('settings-view-title');
    const settingsViewSub = document.getElementById('settings-view-subtitle');
    const settingsBadgeText = document.getElementById('settings-badge-text');
    if (settingsViewTitle) settingsViewTitle.textContent = t('settings.page.title');
    if (settingsViewSub) settingsViewSub.textContent = t('settings.page.subtitle');
    if (settingsBadgeText) settingsBadgeText.textContent = t('settings.page.badge');

    const shortcutTitle = document.getElementById('settings-shortcut-title');
    const shortcutDesc = document.getElementById('settings-shortcut-desc');
    const autoTitle = document.getElementById('settings-autolaunch-title');
    const autoDesc = document.getElementById('settings-autolaunch-desc');
    const langTitle = document.getElementById('settings-language-title');
    const langDesc = document.getElementById('settings-language-desc');

    if (shortcutTitle) shortcutTitle.textContent = t('settings.shortcut.title');
    if (shortcutDesc) shortcutDesc.textContent = t('settings.shortcut.desc');
    if (autoTitle) autoTitle.textContent = t('settings.autolaunch.title');
    if (autoDesc) autoDesc.textContent = t('settings.autolaunch.desc');
    if (langTitle) langTitle.textContent = t('settings.language.title');
    if (langDesc) langDesc.textContent = t('settings.language.desc');

    const shortcutNone = this.shortcutSelect?.querySelector('option[value="Yok"]') as HTMLOptionElement | null;
    if (shortcutNone) shortcutNone.textContent = t('settings.shortcut.none');

    const autoLaunchEnabledOpt = document.getElementById('settings-autolaunch-opt-true') as HTMLOptionElement | null;
    const autoLaunchDisabledOpt = document.getElementById('settings-autolaunch-opt-false') as HTMLOptionElement | null;
    if (autoLaunchEnabledOpt) autoLaunchEnabledOpt.textContent = t('settings.autolaunch.enabled');
    if (autoLaunchDisabledOpt) autoLaunchDisabledOpt.textContent = t('settings.autolaunch.disabled');
  }

  private bindEvents(): void {
    if (this.languageSelect) {
      this.languageSelect.addEventListener('change', () => {
        this.callbacks.onLanguageChange(this.languageSelect.value as Language);
      });
    }

    if (this.shortcutSelect) {
      this.shortcutSelect.addEventListener('change', () => {
        IpcClientService.setGlobalShortcut(this.shortcutSelect.value);
      });
    }

    if (this.autolaunchSelect) {
      this.autolaunchSelect.addEventListener('change', () => {
        IpcClientService.setAutoLaunch(this.autolaunchSelect.value === 'true');
      });
    }
  }
}
