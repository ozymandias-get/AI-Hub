import type { AIServiceCategory } from '../../../shared/types';
import type { ServiceWithSearch } from '../../types';
import { CATEGORY_ICONS } from '../../types';
import { t, getServiceDesc, getCategoryName, getServiceDescLower } from '../../services/i18n-service';
import { APP_CONSTANTS } from '../../../shared/constants/app';

export interface DashboardCallbacks {
  onLaunchService: (serviceId: string, openInNewTab: boolean) => void;
  onToggleFavorite: (serviceId: string, button: HTMLButtonElement) => void;
}

export class DashboardComponent {
  private readonly categoriesBar: HTMLElement;
  private readonly servicesGrid: HTMLElement;
  private readonly searchInput: HTMLInputElement;
  private readonly categorySelect: HTMLSelectElement;
  private readonly serviceSelect: HTMLSelectElement;
  private readonly callbacks: DashboardCallbacks;

  private categories: AIServiceCategory[] = [];
  private flatServices: ServiceWithSearch[] = [];
  private activeCategoryKey = 'all';
  private searchQuery = '';
  private favorites: Set<string> = new Set();
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    categoriesBar: HTMLElement,
    servicesGrid: HTMLElement,
    searchInput: HTMLInputElement,
    categorySelect: HTMLSelectElement,
    serviceSelect: HTMLSelectElement,
    callbacks: DashboardCallbacks
  ) {
    this.categoriesBar = categoriesBar;
    this.servicesGrid = servicesGrid;
    this.searchInput = searchInput;
    this.categorySelect = categorySelect;
    this.serviceSelect = serviceSelect;
    this.callbacks = callbacks;

    this.bindEvents();
  }

  public setData(categories: AIServiceCategory[], favorites: Set<string>): void {
    this.categories = categories;
    this.flatServices = categories.flatMap((categoryGroup) =>
      categoryGroup.services.map((serviceItem) => ({
        ...serviceItem,
        nameLower: serviceItem.name.toLowerCase(),
      }))
    );
    this.favorites = favorites;

    this.populateFallbackSelects();
    this.populateCategories();
    this.renderServices();
  }

  public updateFavorites(favorites: Set<string>): void {
    this.favorites = favorites;
    this.populateCategories();
    if (this.activeCategoryKey === 'favorites') {
      this.renderServices();
    }
  }

  public updateLanguage(): void {
    const dashTitle = document.getElementById('dashboard-title');
    const dashSub = document.getElementById('dashboard-subtitle');
    const sidebarTitle = document.getElementById('sidebar-category-title');
    if (dashTitle) dashTitle.textContent = t('dashboard.title');
    if (dashSub) dashSub.textContent = t('dashboard.subtitle');
    if (sidebarTitle) sidebarTitle.textContent = t('category.title');

    this.searchInput.placeholder = t('search.placeholder');

    this.populateFallbackSelects();
    this.populateCategories();
    this.renderServices();
  }

  public populateFallbackServices(categoryKey: string): void {
    if (!this.serviceSelect) return;
    this.serviceSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = t('service.selectService');
    this.serviceSelect.appendChild(defaultOption);

    const categoryItem = this.categories.find((cat) => cat.key === categoryKey);
    if (!categoryItem) return;

    for (const serviceItem of categoryItem.services) {
      const option = document.createElement('option');
      option.value = serviceItem.id;
      option.textContent = serviceItem.name;
      this.serviceSelect.appendChild(option);
    }
  }

  private bindEvents(): void {
    // Sidebar collapse / expand toggle
    const sidebar = document.getElementById('category-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (sidebar && toggleBtn) {
      const isCollapsed = localStorage.getItem('category_sidebar_collapsed') === 'true';
      if (isCollapsed) {
        sidebar.classList.add('collapsed');
      }
      toggleBtn.addEventListener('click', () => {
        const collapsed = sidebar.classList.toggle('collapsed');
        localStorage.setItem('category_sidebar_collapsed', collapsed ? 'true' : 'false');
      });
    }

    // Search input debounced
    this.searchInput.addEventListener('input', (e) => {
      if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => {
        this.searchQuery = (e.target as HTMLInputElement).value.trim().toLowerCase();
        this.renderServices();
      }, APP_CONSTANTS.SEARCH.DEBOUNCE_MS);
    });

    // Delegated spotlight hover effect (GPU & layout optimized)
    const cardRects = new WeakMap<HTMLElement, DOMRect>();
    let spotlightRafId: number | null = null;
    this.servicesGrid.addEventListener(
      'mousemove',
      (e) => {
        if (spotlightRafId) return;
        const target = e.target as HTMLElement;
        const card = target.closest('.service-card') as HTMLElement | null;
        if (!card) return;

        const clientX = e.clientX;
        const clientY = e.clientY;

        spotlightRafId = requestAnimationFrame(() => {
          spotlightRafId = null;
          let rect = cardRects.get(card);
          if (!rect) {
            rect = card.getBoundingClientRect();
            cardRects.set(card, rect);
          }
          card.style.setProperty('--x', `${clientX - rect.left}px`);
          card.style.setProperty('--y', `${clientY - rect.top}px`);
        });
      },
      { passive: true }
    );

    // Delegated clicks for cards & favorite buttons
    this.servicesGrid.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const favBtn = target.closest('.favorite-btn') as HTMLButtonElement | null;
      if (favBtn) {
        e.stopPropagation();
        const serviceId = favBtn.dataset.id;
        if (serviceId) this.callbacks.onToggleFavorite(serviceId, favBtn);
        return;
      }

      const card = target.closest('.service-card') as HTMLElement | null;
      if (card && card.dataset.id) {
        const openInNewTab = e.ctrlKey || e.metaKey || e.button === 1;
        this.callbacks.onLaunchService(card.dataset.id, openInNewTab);
      }
    });

    // Delegated middle-click open in new tab
    this.servicesGrid.addEventListener('auxclick', (e: MouseEvent) => {
      if (e.button === 1) {
        const target = e.target as HTMLElement;
        const card = target.closest('.service-card') as HTMLElement | null;
        if (card && card.dataset.id) {
          e.preventDefault();
          this.callbacks.onLaunchService(card.dataset.id, true);
        }
      }
    });

    // Delegated logo load error fallback handler
    this.servicesGrid.addEventListener(
      'error',
      (e: Event) => {
        const target = e.target as HTMLElement;
        if (target && target.tagName === 'IMG' && target.classList.contains('service-logo-img')) {
          target.style.display = 'none';
          const fallbackSpan = target.nextElementSibling as HTMLElement | null;
          if (fallbackSpan) {
            fallbackSpan.style.display = 'inline';
          }
        }
      },
      true
    );
  }

  private populateFallbackSelects(): void {
    if (!this.categorySelect || !this.serviceSelect) return;

    this.categorySelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = t('service.selectCategory');
    this.categorySelect.appendChild(defaultOption);

    for (const categoryItem of this.categories) {
      const option = document.createElement('option');
      option.value = categoryItem.key;
      option.textContent = categoryItem.name;
      this.categorySelect.appendChild(option);
    }

    this.categorySelect.onchange = () => {
      this.populateFallbackServices(this.categorySelect.value);
    };

    this.serviceSelect.onchange = () => {
      const selectedId = this.serviceSelect.value;
      if (selectedId) {
        this.callbacks.onLaunchService(selectedId, false);
      }
    };
  }

  private populateCategories(): void {
    this.categoriesBar.replaceChildren();

    const allCount = this.flatServices.length;
    const allTab = this.createCategoryTab('all', CATEGORY_ICONS.all, t('category.all'), allCount);
    this.categoriesBar.appendChild(allTab);

    const favCount = this.favorites.size;
    const favTab = this.createCategoryTab('favorites', CATEGORY_ICONS.favorites, t('category.favorites'), favCount);
    this.categoriesBar.appendChild(favTab);

    for (const categoryItem of this.categories) {
      const count = categoryItem.services ? categoryItem.services.length : 0;
      const icon = CATEGORY_ICONS[categoryItem.key] || '🔮';
      const name = getCategoryName(categoryItem.key);
      const tab = this.createCategoryTab(categoryItem.key, icon, name, count);
      this.categoriesBar.appendChild(tab);
    }
  }

  private createCategoryTab(key: string, icon: string, name: string, count: number): HTMLButtonElement {
    const tab = document.createElement('button');
    tab.className = `category-tab ${this.activeCategoryKey === key ? 'active' : ''}`;
    tab.setAttribute('data-category', key);
    tab.setAttribute('data-tooltip', name);

    const iconSpan = document.createElement('span');
    iconSpan.className = 'category-tab-icon';
    iconSpan.textContent = icon;

    const textSpan = document.createElement('span');
    textSpan.className = 'category-tab-text';
    textSpan.textContent = name;

    const countSpan = document.createElement('span');
    countSpan.className = 'category-tab-count';
    countSpan.textContent = count.toString();

    tab.appendChild(iconSpan);
    tab.appendChild(textSpan);
    tab.appendChild(countSpan);

    tab.addEventListener('click', () => this.selectCategory(key, tab));

    return tab;
  }

  private selectCategory(categoryKey: string, tabElement: HTMLButtonElement): void {
    const tabs = this.categoriesBar.querySelectorAll('.category-tab');
    tabs.forEach((tabNode) => tabNode.classList.remove('active'));
    tabElement.classList.add('active');

    this.activeCategoryKey = categoryKey;
    this.renderServices();
  }

  public renderServices(): void {
    this.servicesGrid.replaceChildren();

    let candidateServices: ServiceWithSearch[] = [];
    if (this.activeCategoryKey === 'all') {
      candidateServices = this.flatServices;
    } else if (this.activeCategoryKey === 'favorites') {
      candidateServices = this.flatServices.filter((service) => this.favorites.has(service.id));
    } else {
      candidateServices = this.flatServices.filter((service) => service.category === this.activeCategoryKey);
    }

    const filteredServices = this.searchQuery
      ? candidateServices.filter(
          (service) =>
            service.nameLower.includes(this.searchQuery) ||
            getServiceDescLower(service.id).includes(this.searchQuery)
        )
      : candidateServices;

    if (filteredServices.length === 0) {
      const noResultContainer = document.createElement('div');
      noResultContainer.className = 'empty-state-message';
      noResultContainer.style.gridColumn = '1 / -1';
      noResultContainer.style.textAlign = 'center';
      noResultContainer.style.padding = '40px';
      noResultContainer.style.color = 'var(--text-dark)';
      noResultContainer.style.fontSize = '14px';
      noResultContainer.style.lineHeight = '1.6';
      if (this.activeCategoryKey === 'favorites') {
        noResultContainer.textContent = t('favorite.empty');
      } else {
        noResultContainer.textContent = t('service.notFound');
      }
      this.servicesGrid.appendChild(noResultContainer);
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const serviceItem of filteredServices) {
      const card = document.createElement('div');
      card.className = 'service-card';
      card.dataset.id = serviceItem.id;

      const categoryName = getCategoryName(serviceItem.category);
      const description = getServiceDesc(serviceItem.id) || t('service.defaultDesc').replace('{name}', serviceItem.name);
      const letter = serviceItem.name.charAt(0);
      const iconUrl = `./logos/${serviceItem.id}.png`;
      const isFavorite = this.favorites.has(serviceItem.id);

      card.innerHTML = `
        <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${serviceItem.id}" title="${isFavorite ? t('favorite.remove') : t('favorite.add')}" aria-label="${isFavorite ? t('favorite.remove') : t('favorite.add')}">★</button>
        <div class="card-header">
          <div class="service-icon">
            <img src="${iconUrl}" alt="" loading="lazy" class="service-logo-img" style="width: 22px; height: 22px; object-fit: contain;">
            <span style="display: none;">${letter}</span>
          </div>
          <div class="service-name"></div>
        </div>
        <div class="service-desc"></div>
        <div class="card-footer">
          <span class="category-tag"></span>
          <button class="launch-btn" title="${t('service.launch')}" aria-label="${t('service.launch')}">➔</button>
        </div>
      `;

      const nameEl = card.querySelector('.service-name');
      const descEl = card.querySelector('.service-desc');
      const catEl = card.querySelector('.category-tag');
      const imgEl = card.querySelector('.service-logo-img') as HTMLImageElement | null;
      const fallbackSpan = card.querySelector('.service-icon span') as HTMLElement | null;

      if (nameEl) nameEl.textContent = serviceItem.name;
      if (descEl) descEl.textContent = description;
      if (catEl) catEl.textContent = categoryName;
      if (imgEl && fallbackSpan) {
        imgEl.onerror = () => {
          imgEl.style.display = 'none';
          fallbackSpan.style.display = 'inline';
        };
      }

      fragment.appendChild(card);
    }

    this.servicesGrid.appendChild(fragment);
  }
}
