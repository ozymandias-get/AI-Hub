import { translations, type Language } from './translations';

let currentLanguage: Language = 'tr';

function t(key: string): string {
  return translations[key]?.[currentLanguage] ?? key;
}

const categorySelect = document.getElementById('category-select') as HTMLSelectElement;
const serviceSelect = document.getElementById('service-select') as HTMLSelectElement;
const splashScreen = document.getElementById('splash-screen')!;
const splashSubtitle = document.getElementById('splash-subtitle')!;
const splashStatus = document.getElementById('splash-status')!;
const errorScreen = document.getElementById('error-screen')!;
const errorMessage = document.getElementById('error-message')!;
const retryButton = document.getElementById('retry-button')!;

// Dashboard & Titlebar elements
const backBtn = document.getElementById('back-btn')!;
const homeBtn = document.getElementById('home-btn')!;
const dashboardView = document.getElementById('dashboard-view')!;
const categoriesBar = document.getElementById('categories-bar')!;
const servicesGrid = document.getElementById('services-grid')!;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const shortcutSelect = document.getElementById('shortcut-select') as HTMLSelectElement;
const maximizeBtn = document.getElementById('maximize-btn')!;
const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
const tabsList = document.getElementById('tabs-list')!;
const newTabBtn = document.getElementById('new-tab-btn')!;

interface AIService {
  id: string;
  name: string;
  url: string;
  category: string;
}

interface AIServiceCategory {
  name: string;
  key: string;
  services: AIService[];
}

interface TabInfo {
  id: string;
  serviceId: string | null;
  name: string;
  isHome: boolean;
  isLoading: boolean;
}

let categories: AIServiceCategory[] = [];
let currentServiceId: string | null = null;
let activeCategoryKey: string = 'all';
let searchQuery: string = '';
let favorites: Set<string> = new Set();
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let splashTimer: ReturnType<typeof setTimeout> | null = null;

// Helper to map category keys to emojis/icons
const categoryIcons: Record<string, string> = {
  all: '🌟',
  chat: '💬',
  writing: '✍️',
  image: '🎨',
  video: '🎬',
  audio: '🎙️',
  code: '💻',
  productivity: '⚡',
  research: '🔬',
  corporate: '🏢',
};

function getServiceDesc(id: string): string {
  const key = `desc.${id}`;
  return translations[key]?.[currentLanguage] ?? '';
}

function getCategoryName(key: string): string {
  return t(`category.${key}`);
}

// Pre-compute lowercase descriptions for efficient search filtering
const serviceDescriptionsLower: Record<string, string> = {};
function rebuildDescriptionsLower(): void {
  for (const [key, value] of Object.entries(translations)) {
    if (key.startsWith('desc.')) {
      serviceDescriptionsLower[key.slice(5)] = value[currentLanguage].toLowerCase();
    }
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  // Setup window controls
  const minimizeBtn = document.getElementById('minimize-btn')!;
  const closeBtn = document.getElementById('close-btn')!;
  const titlebar = document.getElementById('titlebar')!;

  minimizeBtn.addEventListener('click', () => window.aiDesktop.minimize());
  maximizeBtn.addEventListener('click', () => window.aiDesktop.maximize());
  closeBtn.addEventListener('click', () => window.aiDesktop.close());
  titlebar.addEventListener('dblclick', () => window.aiDesktop.maximize());

  // Setup Back & Home buttons
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.aiDesktop.goBack();
  });

  homeBtn.addEventListener('click', () => {
    window.aiDesktop.showHomepage();
  });

  // Setup New Tab button
  newTabBtn.addEventListener('click', () => {
    window.aiDesktop.createTab();
  });

  // Setup notice banner dismiss button
  const noticeCloseBtn = document.getElementById('notice-close-btn');
  const authWarningBanner = document.getElementById('auth-warning-banner');
  if (noticeCloseBtn && authWarningBanner) {
    noticeCloseBtn.addEventListener('click', () => {
      authWarningBanner.style.opacity = '0';
      authWarningBanner.style.transform = 'translateY(-8px)';
      authWarningBanner.style.transition = 'all 0.25s ease';
      setTimeout(() => {
        authWarningBanner.classList.add('hidden');
      }, 250);
    });
  }

  // Delegated spotlight hover effect with rAF to prevent layout thrashing
  let spotlightRafId: number | null = null;
  servicesGrid.addEventListener('mousemove', (e) => {
    if (spotlightRafId) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    const target = e.target as HTMLElement;
    spotlightRafId = requestAnimationFrame(() => {
      spotlightRafId = null;
      const card = target.closest('.service-card') as HTMLElement;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--x', `${clientX - rect.left}px`);
      card.style.setProperty('--y', `${clientY - rect.top}px`);
    });
  });

  // Load favorites
  try {
    const saved = localStorage.getItem('favorite_services');
    if (saved) {
      favorites = new Set(JSON.parse(saved));
    }
  } catch (err) {
    console.warn('Failed to load favorites:', err);
  }

  // Load data
  try {
    categories = await window.aiDesktop.getServices();
  } catch (err) {
    console.error('[Renderer] Failed to load services:', err);
  }
  
  populateFallbackSelects();
  populateDashboardCategories();
  renderServices();

  // Load initial Tab state
  try {
    if (window.aiDesktop.getTabsState) {
      const tabsState = await window.aiDesktop.getTabsState();
      if (tabsState) {
        renderTabs(tabsState.tabs, tabsState.activeTabId);
      }
    }
  } catch (err) {
    console.warn('[Renderer] Failed to fetch initial tabs state:', err);
  }

  // Bind Tab updates
  if (window.aiDesktop.onTabsUpdated) {
    window.aiDesktop.onTabsUpdated((data) => {
      renderTabs(data.tabs, data.activeTabId);
    });
  }

  // Set initial active state from settings
  try {
    const currentId = await window.aiDesktop.getCurrentServiceId();
    if (currentId) {
      switchToServiceUI(currentId);
      const loading = await window.aiDesktop.isServiceLoading();
      if (loading) {
        splashScreen.classList.remove('done', 'hidden');
        splashScreen.classList.add('active');
        splashStatus.textContent = t('splash.connecting');
        updateSplashLogo(currentId);
        const svc = categories.flatMap(c => c.services).find(s => s.id === currentId);
        if (svc) {
          splashSubtitle.textContent = svc.name;
        }
      } else {
        splashScreen.classList.add('hidden');
      }
    } else {
      showHomepageUI();
    }
  } catch (err) {
    console.error('[Renderer] Failed to load active service:', err);
    showHomepageUI();
  }

  // Bind Search events with debouncing (150ms)
  searchInput.addEventListener('input', (e) => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      searchQuery = (e.target as HTMLInputElement).value.trim().toLowerCase();
      renderServices();
    }, 150);
  });

  // Bind Error Screen retry button
  retryButton.addEventListener('click', () => {
    if (currentServiceId) {
      launchService(currentServiceId);
    } else {
      window.aiDesktop.retryLoad();
    }
  });

  // Setup IPC Event Listeners from Main Process
  if (window.aiDesktop.onServiceLoadingStart) {
    window.aiDesktop.onServiceLoadingStart(() => {
      if (splashTimer) { clearTimeout(splashTimer); splashTimer = null; }
      errorScreen.classList.add('hidden');
      splashScreen.classList.remove('done', 'hidden');
      splashScreen.classList.add('active');
      splashStatus.textContent = t('splash.connecting');
      if (currentServiceId) {
        updateSplashLogo(currentServiceId);
      }
    });
  }

  if (window.aiDesktop.onServiceLoadingStop) {
    window.aiDesktop.onServiceLoadingStop(() => {
      splashScreen.classList.add('done');
      if (splashTimer) clearTimeout(splashTimer);
      splashTimer = setTimeout(() => {
        splashScreen.classList.add('hidden');
        splashTimer = null;
      }, 600);
    });
  }

  if (window.aiDesktop.onServiceLoadingError) {
    window.aiDesktop.onServiceLoadingError((desc: string) => {
      splashScreen.classList.add('hidden');
      errorMessage.textContent = desc;
      errorScreen.classList.remove('hidden');
    });
  }

  if (window.aiDesktop.onUpdateServiceUI) {
    window.aiDesktop.onUpdateServiceUI((info) => {
      if (info.isHome) {
        showHomepageUI();
      } else if (info.serviceId) {
        switchToServiceUI(info.serviceId);
        updateSplashLogo(info.serviceId);
        if (info.name) {
          splashSubtitle.textContent = info.name;
        }
      }
    });
  }

  if (window.aiDesktop.onMaximizeState) {
    window.aiDesktop.onMaximizeState((isMaximized: boolean) => {
      maximizeBtn.classList.toggle('is-maximized', isMaximized);
    });
  }

  // Load language setting
  try {
    const savedLang = await window.aiDesktop.getLanguage();
    if (savedLang === 'en' || savedLang === 'tr') {
      currentLanguage = savedLang;
    }
  } catch (err) {
    console.warn('Failed to load language:', err);
  }

  rebuildDescriptionsLower();
  applyUILanguage();

  if (languageSelect) {
    languageSelect.value = currentLanguage;
    languageSelect.addEventListener('change', () => {
      switchLanguage(languageSelect.value as Language);
    });
  }

  // Load and bind global shortcut setting
  try {
    const activeShortcut = await window.aiDesktop.getGlobalShortcut();
    if (shortcutSelect) {
      shortcutSelect.value = activeShortcut;
    }
  } catch (err) {
    console.warn('Failed to load global shortcut setting:', err);
  }

  if (shortcutSelect) {
    shortcutSelect.addEventListener('change', () => {
      window.aiDesktop.setGlobalShortcut(shortcutSelect.value);
    });
  }
});

function renderTabs(tabs: TabInfo[], activeTabId: string | null): void {
  if (!tabsList) return;
  tabsList.innerHTML = '';

  const fragment = document.createDocumentFragment();

  for (const tab of tabs) {
    const tabEl = document.createElement('div');
    const isActive = tab.id === activeTabId;
    tabEl.className = `tab-item ${isActive ? 'active' : ''}`;

    let iconHtml = '';
    if (tab.isHome) {
      iconHtml = `<span class="tab-icon">🏠</span>`;
    } else if (tab.serviceId) {
      iconHtml = `
        <span class="tab-icon">
          <img src="./logos/${tab.serviceId}.png" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" style="width:14px;height:14px;object-fit:contain;">
          <span style="display:none; font-size:10px;">${tab.name.charAt(0)}</span>
        </span>
      `;
    } else {
      iconHtml = `<span class="tab-icon">✦</span>`;
    }

    const titleText = tab.isHome ? (currentLanguage === 'tr' ? 'Ana Sayfa' : 'Home') : tab.name;

    tabEl.innerHTML = `
      ${iconHtml}
      <span class="tab-title">${titleText}</span>
      <button class="tab-close-btn" title="${t('titlebar.close')}">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    // Tab switch on click
    tabEl.addEventListener('click', () => {
      window.aiDesktop.switchTab(tab.id);
    });

    // Middle click to close tab
    tabEl.addEventListener('auxclick', (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        window.aiDesktop.closeTab(tab.id);
      }
    });

    // Close button click
    const closeBtn = tabEl.querySelector('.tab-close-btn') as HTMLButtonElement;
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.aiDesktop.closeTab(tab.id);
      });
    }

    fragment.appendChild(tabEl);
  }

  tabsList.appendChild(fragment);
}

function switchLanguage(lang: Language): void {
  currentLanguage = lang;
  localStorage.setItem('app_language', lang);
  window.aiDesktop.setLanguage(lang);
  rebuildDescriptionsLower();
  applyUILanguage();
  populateDashboardCategories();
  renderServices();
}

function applyUILanguage(): void {
  const dashTitle = document.getElementById('dashboard-title');
  const dashSub = document.getElementById('dashboard-subtitle');
  if (dashTitle) dashTitle.textContent = t('dashboard.title');
  if (dashSub) dashSub.textContent = t('dashboard.subtitle');

  searchInput.placeholder = t('search.placeholder');
  backBtn.title = t('titlebar.back');
  homeBtn.title = t('titlebar.home');
  newTabBtn.title = currentLanguage === 'tr' ? 'Yeni Sekme' : 'New Tab';

  const minimizeBtn = document.getElementById('minimize-btn')!;
  const closeBtn = document.getElementById('close-btn')!;
  minimizeBtn.title = t('titlebar.minimize');
  maximizeBtn.title = t('titlebar.maximize');
  closeBtn.title = t('titlebar.close');

  document.getElementById('settings-shortcut-title')!.textContent = t('settings.shortcut.title');
  document.getElementById('settings-shortcut-desc')!.textContent = t('settings.shortcut.desc');
  document.getElementById('settings-language-title')!.textContent = t('settings.language.title');
  document.getElementById('settings-language-desc')!.textContent = t('settings.language.desc');

  const shortcutNone = shortcutSelect.querySelector('option[value="Yok"]') as HTMLOptionElement;
  if (shortcutNone) shortcutNone.textContent = t('settings.shortcut.none');

  document.getElementById('dashboard-title')!.textContent = t('dashboard.title');
  document.getElementById('dashboard-subtitle')!.textContent = t('dashboard.subtitle');

  const authTitle = document.querySelector('.notice-title') as HTMLElement;
  const authDesc = document.querySelector('.notice-desc') as HTMLElement;
  if (authTitle) authTitle.textContent = t('auth.warning.title');
  if (authDesc) authDesc.textContent = t('auth.warning.desc');

  splashStatus.textContent = t('splash.connecting');
  const splashSub = document.getElementById('splash-subtitle');
  if (splashSub && !currentServiceId) splashSub.textContent = t('splash.loading');

  const errorTitle = document.querySelector('.error-content h1') as HTMLElement;
  const errorHint = document.querySelector('.error-hint') as HTMLElement;
  if (errorTitle) errorTitle.textContent = t('error.title');
  if (errorHint) errorHint.textContent = t('error.hint');
  retryButton.textContent = t('error.retry');
}

function populateFallbackSelects(): void {
  if (!categorySelect || !serviceSelect) return;
  
  categorySelect.innerHTML = `<option value="">${t('service.selectCategory')}</option>`;
  for (const cat of categories) {
    const option = document.createElement('option');
    option.value = cat.key;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  }

  categorySelect.addEventListener('change', () => {
    const key = categorySelect.value;
    populateFallbackServices(key);
  });

  serviceSelect.addEventListener('change', () => {
    const id = serviceSelect.value;
    if (id) {
      launchService(id);
    }
  });
}

function populateFallbackServices(categoryKey: string): void {
  if (!serviceSelect) return;
  serviceSelect.innerHTML = `<option value="">${t('service.selectService')}</option>`;
  const cat = categories.find(c => c.key === categoryKey);
  if (!cat) return;

  for (const svc of cat.services) {
    const option = document.createElement('option');
    option.value = svc.id;
    option.textContent = svc.name;
    serviceSelect.appendChild(option);
  }
}

function populateDashboardCategories(): void {
  categoriesBar.innerHTML = '';
  
  const allTab = document.createElement('button');
  allTab.className = 'category-tab active';
  allTab.textContent = `${categoryIcons.all} ${t('category.all')}`;
  allTab.addEventListener('click', () => selectCategory('all', allTab));
  categoriesBar.appendChild(allTab);

  const favTab = document.createElement('button');
  favTab.className = 'category-tab';
  favTab.textContent = `⭐ ${t('category.favorites')}`;
  favTab.addEventListener('click', () => selectCategory('favorites', favTab));
  categoriesBar.appendChild(favTab);

  for (const cat of categories) {
    const tab = document.createElement('button');
    tab.className = 'category-tab';
    const icon = categoryIcons[cat.key] || '🔮';
    tab.textContent = `${icon} ${getCategoryName(cat.key)}`;
    tab.addEventListener('click', () => selectCategory(cat.key, tab));
    categoriesBar.appendChild(tab);
  }
}

function selectCategory(categoryKey: string, tabElement: HTMLButtonElement): void {
  const tabs = categoriesBar.querySelectorAll('.category-tab');
  tabs.forEach(t => t.classList.remove('active'));
  tabElement.classList.add('active');

  activeCategoryKey = categoryKey;
  renderServices();
}

function renderServices(): void {
  servicesGrid.replaceChildren();

  let allServices: AIService[] = [];
  if (activeCategoryKey === 'all') {
    allServices = categories.flatMap(c => c.services);
  } else if (activeCategoryKey === 'favorites') {
    allServices = categories.flatMap(c => c.services).filter(s => favorites.has(s.id));
  } else {
    const cat = categories.find(c => c.key === activeCategoryKey);
    if (cat) {
      allServices = cat.services;
    }
  }

  const filtered = allServices.filter(s => 
    s.name.toLowerCase().includes(searchQuery) || 
    (serviceDescriptionsLower[s.id] && serviceDescriptionsLower[s.id].includes(searchQuery))
  );

  if (filtered.length === 0) {
    const noResult = document.createElement('div');
    noResult.style.gridColumn = '1 / -1';
    noResult.style.textAlign = 'center';
    noResult.style.padding = '40px';
    noResult.style.color = 'var(--text-dark)';
    noResult.style.fontSize = '14px';
    noResult.style.lineHeight = '1.6';
    if (activeCategoryKey === 'favorites') {
      noResult.textContent = t('favorite.empty');
    } else {
      noResult.textContent = t('service.notFound');
    }
    servicesGrid.appendChild(noResult);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const svc of filtered) {
    const card = document.createElement('div');
    card.className = 'service-card';

    const categoryName = getCategoryName(svc.category);
    const description = getServiceDesc(svc.id) || t('service.defaultDesc').replace('{name}', svc.name);
    const letter = svc.name.charAt(0);

    const hasLocalLogo = true;
    const iconUrl = `./logos/${svc.id}.png`;

    const isFavorite = favorites.has(svc.id);

    card.innerHTML = `
      <button class="favorite-btn ${isFavorite ? 'active' : ''}" title="${isFavorite ? t('favorite.remove') : t('favorite.add')}">★</button>
      <div class="card-header">
        <div class="service-icon">
          ${hasLocalLogo 
            ? `<img src="${iconUrl}" alt="" loading="lazy" style="width: 22px; height: 22px; object-fit: contain;">
               <span style="display: none;">${letter}</span>`
            : `<span style="display: inline;">${letter}</span>`
          }
        </div>
        <div class="service-name">${svc.name}</div>
      </div>
      <div class="service-desc">${description}</div>
      <div class="card-footer">
        <span class="category-tag">${categoryName}</span>
        <button class="launch-btn" title="${t('service.launch')}">➔</button>
      </div>
    `;

    const imgElement = card.querySelector('img');
    if (imgElement) {
      imgElement.addEventListener('error', () => {
        imgElement.style.display = 'none';
        const fallbackSpan = imgElement.nextElementSibling as HTMLElement;
        if (fallbackSpan) {
          fallbackSpan.style.display = 'inline';
        }
      });
      if (imgElement.complete && imgElement.naturalWidth === 0) {
        imgElement.style.display = 'none';
        const fallbackSpan = imgElement.nextElementSibling as HTMLElement;
        if (fallbackSpan) {
          fallbackSpan.style.display = 'inline';
        }
      }
    }

    const favBtn = card.querySelector('.favorite-btn') as HTMLButtonElement;
    if (favBtn) {
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(svc.id, favBtn);
      });
    }

    card.addEventListener('click', (e: MouseEvent) => {
      const openInNewTab = e.ctrlKey || e.metaKey || e.button === 1;
      launchService(svc.id, openInNewTab);
    });

    card.addEventListener('auxclick', (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        launchService(svc.id, true);
      }
    });

    fragment.appendChild(card);
  }

  servicesGrid.appendChild(fragment);
}

function toggleFavorite(serviceId: string, button: HTMLButtonElement): void {
  if (favorites.has(serviceId)) {
    favorites.delete(serviceId);
    button.classList.remove('active');
    button.title = t('favorite.add');
  } else {
    favorites.add(serviceId);
    button.classList.add('active');
    button.title = t('favorite.remove');
  }
  localStorage.setItem('favorite_services', JSON.stringify(Array.from(favorites)));
  
  if (activeCategoryKey === 'favorites') {
    renderServices();
  }
}

function updateSplashLogo(serviceId: string | null): void {
  const splashLogoImg = document.getElementById('splash-logo-img') as HTMLImageElement;
  const splashLogoFallback = document.getElementById('splash-logo-fallback') as HTMLElement;
  const splashTitle = document.getElementById('splash-title') as HTMLElement;
  
  if (!splashLogoImg || !splashLogoFallback) return;

  if (serviceId) {
    const svc = categories.flatMap(c => c.services).find(s => s.id === serviceId);
    if (svc) {
      if (splashTitle) splashTitle.textContent = svc.name;
      const letter = svc.name.charAt(0);
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

      splashLogoImg.src = `./logos/${svc.id}.png`;
      return;
    }
  }

  if (splashTitle) splashTitle.textContent = t('app.title');
  splashLogoImg.classList.add('hidden');
  splashLogoFallback.textContent = '✦';
  splashLogoFallback.style.display = 'inline';
}

function launchService(serviceId: string, openInNewTab: boolean = false): void {
  currentServiceId = serviceId;
  errorScreen.classList.add('hidden');
  
  splashScreen.classList.remove('done', 'hidden');
  splashScreen.classList.add('active');
  splashStatus.textContent = t('splash.connecting');
  updateSplashLogo(serviceId);

  const svc = categories.flatMap(c => c.services).find(s => s.id === serviceId);
  if (svc) {
    splashSubtitle.textContent = svc.name;
    document.title = `${t('app.title')} - ${svc.name}`;
  }

  if (categorySelect && serviceSelect && svc) {
    categorySelect.value = svc.category;
    populateFallbackServices(svc.category);
    serviceSelect.value = svc.id;
  }

  window.aiDesktop.openServiceInTab(serviceId, openInNewTab);
}

function showHomepageUI(): void {
  currentServiceId = null;
  homeBtn.classList.add('active');
  dashboardView.classList.remove('hidden');
  splashScreen.classList.add('hidden');
  errorScreen.classList.add('hidden');
  document.title = t('app.title');
}

function switchToServiceUI(serviceId: string): void {
  currentServiceId = serviceId;
  homeBtn.classList.remove('active');
  dashboardView.classList.add('hidden');
  
  const svc = categories.flatMap(c => c.services).find(s => s.id === serviceId);
  if (svc) {
    document.title = `${t('app.title')} - ${svc.name}`;
    
    if (categorySelect && serviceSelect) {
      categorySelect.value = svc.category;
      populateFallbackServices(svc.category);
      serviceSelect.value = svc.id;
    }
  }
}
