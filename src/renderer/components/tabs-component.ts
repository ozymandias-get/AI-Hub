import type { TabInfo } from '../../shared/types';
import { t } from '../services/i18n-service';
import { IpcClientService } from '../services/ipc-client';

export class TabsComponent {
  private lastStateKey = '';

  constructor(private readonly tabsListContainer: HTMLElement) {
    this.bindEvents();
  }

  private bindEvents(): void {
    this.tabsListContainer.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const closeBtn = target.closest('.tab-close-btn') as HTMLElement | null;
      if (closeBtn) {
        e.stopPropagation();
        const tabId = closeBtn.dataset.tabId;
        if (tabId) IpcClientService.closeTab(tabId);
        return;
      }

      const tabElement = target.closest('.tab-item') as HTMLElement | null;
      if (tabElement) {
        const tabId = tabElement.dataset.tabId;
        if (tabId) IpcClientService.switchTab(tabId);
      }
    });

    this.tabsListContainer.addEventListener('auxclick', (e: MouseEvent) => {
      if (e.button === 1) {
        const target = e.target as HTMLElement;
        const tabElement = target.closest('.tab-item') as HTMLElement | null;
        if (tabElement && tabElement.dataset.tabId) {
          e.preventDefault();
          e.stopPropagation();
          IpcClientService.closeTab(tabElement.dataset.tabId);
        }
      }
    });
  }

  public render(tabs: TabInfo[], activeTabId: string | null): void {
    const currentStateKey = `${activeTabId}:${tabs.map((t) => `${t.id}_${t.name}_${t.isLoading}_${t.isHome}`).join('|')}`;
    if (currentStateKey === this.lastStateKey) {
      return;
    }
    this.lastStateKey = currentStateKey;
    this.tabsListContainer.replaceChildren();

    const fragment = document.createDocumentFragment();

    for (const tabItem of tabs) {
      const tabElement = document.createElement('div');
      const isActive = tabItem.id === activeTabId;
      tabElement.className = `tab-item ${isActive ? 'active' : ''}`;
      tabElement.dataset.tabId = tabItem.id;

      const iconSpan = document.createElement('span');
      iconSpan.className = 'tab-icon';

      if (tabItem.isHome) {
        iconSpan.textContent = '🏠';
      } else if (tabItem.serviceId) {
        const img = document.createElement('img');
        img.src = `./logos/${tabItem.serviceId}.png`;
        img.alt = '';
        img.style.width = '14px';
        img.style.height = '14px';
        img.style.objectFit = 'contain';

        const fallbackChar = document.createElement('span');
        fallbackChar.style.display = 'none';
        fallbackChar.style.fontSize = '10px';
        fallbackChar.textContent = tabItem.name.charAt(0);

        img.onerror = () => {
          img.style.display = 'none';
          fallbackChar.style.display = 'inline';
        };

        iconSpan.appendChild(img);
        iconSpan.appendChild(fallbackChar);
      } else {
        iconSpan.textContent = '✦';
      }

      const titleSpan = document.createElement('span');
      titleSpan.className = 'tab-title';
      titleSpan.textContent = tabItem.isHome ? t('titlebar.home') : tabItem.name;

      const closeButton = document.createElement('button');
      closeButton.className = 'tab-close-btn';
      closeButton.dataset.tabId = tabItem.id;
      closeButton.title = t('titlebar.close');
      closeButton.setAttribute('aria-label', t('titlebar.close'));
      closeButton.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

      tabElement.appendChild(iconSpan);
      tabElement.appendChild(titleSpan);
      tabElement.appendChild(closeButton);

      fragment.appendChild(tabElement);
    }

    this.tabsListContainer.appendChild(fragment);
  }
}
