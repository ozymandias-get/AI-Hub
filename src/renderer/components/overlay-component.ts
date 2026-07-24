import type { AIServiceCategory } from '../../shared/types';
import { t } from '../services/i18n-service';
import { APP_CONSTANTS } from '../../shared/constants/app';

export interface OverlayCallbacks {
  onRetry: (serviceId: string | null) => void;
}

export class OverlayComponent {
  private readonly splashScreen: HTMLElement;
  private readonly splashSubtitle: HTMLElement;
  private readonly splashStatus: HTMLElement;
  private readonly errorScreen: HTMLElement;
  private readonly errorMessage: HTMLElement;
  private readonly retryButton: HTMLElement;
  private readonly callbacks: OverlayCallbacks;

  private splashTimer: ReturnType<typeof setTimeout> | null = null;
  private categories: AIServiceCategory[] = [];
  private currentServiceId: string | null = null;

  constructor(
    splashScreen: HTMLElement,
    splashSubtitle: HTMLElement,
    splashStatus: HTMLElement,
    errorScreen: HTMLElement,
    errorMessage: HTMLElement,
    retryButton: HTMLElement,
    callbacks: OverlayCallbacks
  ) {
    this.splashScreen = splashScreen;
    this.splashSubtitle = splashSubtitle;
    this.splashStatus = splashStatus;
    this.errorScreen = errorScreen;
    this.errorMessage = errorMessage;
    this.retryButton = retryButton;
    this.callbacks = callbacks;

    this.initNoticeBanner();
    this.bindEvents();
  }

  public setCategories(categories: AIServiceCategory[]): void {
    this.categories = categories;
  }

  public setCurrentServiceId(serviceId: string | null): void {
    this.currentServiceId = serviceId;
  }

  public showSplash(serviceId?: string): void {
    if (this.splashTimer) {
      clearTimeout(this.splashTimer);
      this.splashTimer = null;
    }
    const targetServiceId = serviceId || this.currentServiceId;
    if (targetServiceId) {
      this.updateSplashLogo(targetServiceId);
      const serviceItem = this.categories
        .flatMap((categoryGroup) => categoryGroup.services)
        .find((service) => service.id === targetServiceId);
      if (serviceItem) {
        this.splashSubtitle.textContent = serviceItem.name;
      }
    }
    this.errorScreen.classList.add('hidden');
    this.splashScreen.classList.remove('done', 'hidden');
    this.splashScreen.classList.add('active');
    this.splashStatus.textContent = t('splash.connecting');
  }

  public hideSplash(): void {
    this.splashScreen.classList.add('done');
    if (this.splashTimer) clearTimeout(this.splashTimer);
    this.splashTimer = setTimeout(() => {
      this.splashScreen.classList.add('hidden');
      this.splashTimer = null;
    }, APP_CONSTANTS.OVERLAY.HIDE_SPLASH_DELAY_MS);
  }

  public showError(errorDescription: string): void {
    this.splashScreen.classList.add('hidden');
    this.errorMessage.textContent = errorDescription;
    this.errorScreen.classList.remove('hidden');
  }

  public hideAll(): void {
    this.splashScreen.classList.add('hidden');
    this.errorScreen.classList.add('hidden');
  }

  public updateSplashLogo(serviceId: string | null): void {
    const splashLogoImg = document.getElementById('splash-logo-img') as HTMLImageElement | null;
    const splashLogoFallback = document.getElementById('splash-logo-fallback') as HTMLElement | null;
    const splashTitle = document.getElementById('splash-title') as HTMLElement | null;

    if (!splashLogoImg || !splashLogoFallback) return;

    if (serviceId) {
      const serviceItem = this.categories
        .flatMap((categoryGroup) => categoryGroup.services)
        .find((service) => service.id === serviceId);
      if (serviceItem) {
        if (splashTitle) splashTitle.textContent = serviceItem.name;
        const letter = serviceItem.name.charAt(0);
        splashLogoFallback.textContent = letter;
        splashLogoFallback.style.display = 'inline';

        splashLogoImg.onload = () => {
          splashLogoImg.classList.remove('hidden');
          splashLogoFallback.style.display = 'none';
        };
        splashLogoImg.onerror = () => {
          splashLogoImg.classList.add('hidden');
          splashLogoFallback.style.display = 'inline';
        };

        splashLogoImg.src = `./logos/${serviceItem.id}.png`;
        return;
      }
    }

    if (splashTitle) splashTitle.textContent = t('app.title');
    splashLogoImg.classList.add('hidden');
    splashLogoFallback.textContent = '✦';
    splashLogoFallback.style.display = 'inline';
  }

  public updateLanguage(): void {
    const authTitle = document.querySelector('.notice-title') as HTMLElement | null;
    const authDesc = document.querySelector('.notice-desc') as HTMLElement | null;
    if (authTitle) authTitle.textContent = t('auth.warning.title');
    if (authDesc) authDesc.textContent = t('auth.warning.desc');

    this.splashStatus.textContent = t('splash.connecting');
    const splashSub = document.getElementById('splash-subtitle');
    if (splashSub && !this.currentServiceId) splashSub.textContent = t('splash.loading');

    const errorTitle = document.querySelector('.error-content h1') as HTMLElement | null;
    const errorHint = document.querySelector('.error-hint') as HTMLElement | null;
    if (errorTitle) errorTitle.textContent = t('error.title');
    if (errorHint) errorHint.textContent = t('error.hint');
    this.retryButton.textContent = t('error.retry');
  }

  private initNoticeBanner(): void {
    const noticeCloseBtn = document.getElementById('notice-close-btn');
    const authWarningBanner = document.getElementById('auth-warning-banner');
    if (noticeCloseBtn && authWarningBanner) {
      noticeCloseBtn.addEventListener('click', () => {
        authWarningBanner.style.opacity = '0';
        authWarningBanner.style.transform = 'translateY(-8px)';
        authWarningBanner.style.transition = 'all 0.25s ease';
        setTimeout(() => {
          authWarningBanner.classList.add('hidden');
        }, APP_CONSTANTS.OVERLAY.NOTICE_ANIMATION_MS);
      });
    }
  }

  private bindEvents(): void {
    this.retryButton.addEventListener('click', () => {
      this.callbacks.onRetry(this.currentServiceId);
    });
  }
}
