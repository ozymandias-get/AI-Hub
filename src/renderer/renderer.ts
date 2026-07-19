import { translations, type Language } from './translations';

let currentLanguage: Language = 'tr';

function t(key: string): string {
  return translations[key]?.[currentLanguage] ?? key;
}

const titlebarText = document.getElementById('titlebar-text')!;
const categorySelect = document.getElementById('category-select') as HTMLSelectElement;
const serviceSelect = document.getElementById('service-select') as HTMLSelectElement;
const splashScreen = document.getElementById('splash-screen')!;
const splashSubtitle = document.getElementById('splash-subtitle')!;
const splashStatus = document.getElementById('splash-status')!;
const errorScreen = document.getElementById('error-screen')!;
const errorMessage = document.getElementById('error-message')!;
const retryButton = document.getElementById('retry-button')!;

// New dashboard elements
const backBtn = document.getElementById('back-btn')!;
const homeBtn = document.getElementById('home-btn')!;
const dashboardView = document.getElementById('dashboard-view')!;
const categoriesBar = document.getElementById('categories-bar')!;
const servicesGrid = document.getElementById('services-grid')!;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const shortcutSelect = document.getElementById('shortcut-select') as HTMLSelectElement;
const maximizeBtn = document.getElementById('maximize-btn')!;
const languageSelect = document.getElementById('language-select') as HTMLSelectElement;


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
  console.log('[Renderer] DOMContentLoaded started');
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



  // Delegated spotlight hover effect with rAF to prevent layout thrashing
  let spotlightRafId: number | null = null;
  servicesGrid.addEventListener('mousemove', (e) => {
    if (spotlightRafId) return; // Skip if a frame is already scheduled
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
    console.log('[Renderer] Fetching services...');
    categories = await window.aiDesktop.getServices();
    console.log('[Renderer] Services fetched:', categories ? categories.length : 0);
  } catch (err) {
    console.error('[Renderer] Failed to load services:', err);
  }
  
  // Populate fallback selects for backward compatibility
  populateFallbackSelects();

  // Populate Dashboard category tabs and services grid
  populateDashboardCategories();
  renderServices();

  // Set initial active state from settings
  try {
    console.log('[Renderer] Fetching current service ID...');
    const currentId = await window.aiDesktop.getCurrentServiceId();
    console.log('[Renderer] Current service ID:', currentId);
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
  servicesGrid.replaceChildren(); // More performant than innerHTML = ''

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

  // Filter by search query using pre-computed lowercase cache
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

    card.addEventListener('click', () => {
      launchService(svc.id);
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

function launchService(serviceId: string): void {
  currentServiceId = serviceId;
  errorScreen.classList.add('hidden');
  
  splashScreen.classList.remove('done', 'hidden');
  splashScreen.classList.add('active');
  splashStatus.textContent = t('splash.connecting');
  updateSplashLogo(serviceId);

  const svc = categories.flatMap(c => c.services).find(s => s.id === serviceId);
  if (svc) {
    splashSubtitle.textContent = svc.name;
    titlebarText.textContent = `${t('app.title')} - ${svc.name}`;
    document.title = `${t('app.title')} - ${svc.name}`;
  }

  if (categorySelect && serviceSelect && svc) {
    categorySelect.value = svc.category;
    populateFallbackServices(svc.category);
    serviceSelect.value = svc.id;
  }

  window.aiDesktop.selectService(serviceId);
}

function showHomepageUI(): void {
  currentServiceId = null;
  homeBtn.classList.add('active');
  dashboardView.classList.remove('hidden');
  splashScreen.classList.add('hidden');
  errorScreen.classList.add('hidden');
  titlebarText.textContent = t('app.title');
  document.title = t('app.title');
}

function switchToServiceUI(serviceId: string): void {
  currentServiceId = serviceId;
  homeBtn.classList.remove('active');
  dashboardView.classList.add('hidden');
  
  const svc = categories.flatMap(c => c.services).find(s => s.id === serviceId);
  if (svc) {
    titlebarText.textContent = `${t('app.title')} - ${svc.name}`;
    document.title = `${t('app.title')} - ${svc.name}`;
    
    if (categorySelect && serviceSelect) {
      categorySelect.value = svc.category;
      populateFallbackServices(svc.category);
      serviceSelect.value = svc.id;
    }
  }
}
