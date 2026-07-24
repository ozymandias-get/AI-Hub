import { t } from '../services/i18n-service';
import { IpcClientService } from '../services/ipc-client';

export interface TitlebarCallbacks {
  onHomeClick: () => void;
  onSettingsClick: () => void;
}

export class TitlebarComponent {
  private readonly minimizeBtn: HTMLElement | null;
  private readonly maximizeBtn: HTMLElement | null;
  private readonly closeBtn: HTMLElement | null;
  private readonly titlebar: HTMLElement | null;
  private readonly backBtn: HTMLElement | null;
  private readonly homeBtn: HTMLElement | null;
  private readonly settingsBtn: HTMLElement | null;
  private readonly newTabBtn: HTMLElement | null;

  constructor(private readonly callbacks: TitlebarCallbacks) {
    this.minimizeBtn = document.getElementById('minimize-btn');
    this.maximizeBtn = document.getElementById('maximize-btn');
    this.closeBtn = document.getElementById('close-btn');
    this.titlebar = document.getElementById('titlebar');
    this.backBtn = document.getElementById('back-btn');
    this.homeBtn = document.getElementById('home-btn');
    this.settingsBtn = document.getElementById('settings-btn');
    this.newTabBtn = document.getElementById('new-tab-btn');

    this.bindEvents();
  }

  private bindEvents(): void {
    this.minimizeBtn?.addEventListener('click', () => IpcClientService.minimizeWindow());
    this.maximizeBtn?.addEventListener('click', () => IpcClientService.maximizeWindow());
    this.closeBtn?.addEventListener('click', () => IpcClientService.closeWindow());
    this.titlebar?.addEventListener('dblclick', () => IpcClientService.maximizeWindow());

    this.backBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      IpcClientService.goBack();
    });

    this.homeBtn?.addEventListener('click', () => {
      this.callbacks.onHomeClick();
      IpcClientService.showHomepage();
    });

    this.settingsBtn?.addEventListener('click', () => {
      this.callbacks.onSettingsClick();
      IpcClientService.showHomepage();
    });

    this.newTabBtn?.addEventListener('click', () => {
      IpcClientService.createTab();
    });

    if (this.maximizeBtn) {
      IpcClientService.onMaximizeState((isMaximized: boolean) => {
        this.maximizeBtn?.classList.toggle('is-maximized', isMaximized);
      });
    }
  }

  public updateLanguage(): void {
    if (this.backBtn) this.backBtn.title = t('titlebar.back');
    if (this.homeBtn) this.homeBtn.title = t('titlebar.home');
    if (this.settingsBtn) this.settingsBtn.title = t('titlebar.settings');
    if (this.newTabBtn) this.newTabBtn.title = t('titlebar.newTab');
    if (this.minimizeBtn) this.minimizeBtn.title = t('titlebar.minimize');
    if (this.maximizeBtn) this.maximizeBtn.title = t('titlebar.maximize');
    if (this.closeBtn) this.closeBtn.title = t('titlebar.close');
  }

  public setActiveNavButton(buttonId: 'home' | 'settings' | 'none'): void {
    if (this.homeBtn) this.homeBtn.classList.toggle('active', buttonId === 'home');
    if (this.settingsBtn) this.settingsBtn.classList.toggle('active', buttonId === 'settings');
  }
}
