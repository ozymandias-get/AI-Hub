const titlebarText = document.getElementById('titlebar-text')!;
const categorySelect = document.getElementById('category-select') as HTMLSelectElement;
const serviceSelect = document.getElementById('service-select') as HTMLSelectElement;
const splashScreen = document.getElementById('splash-screen')!;
const splashSubtitle = document.getElementById('splash-subtitle')!;
const splashStatus = document.getElementById('splash-status')!;
const errorScreen = document.getElementById('error-screen')!;
const errorMessage = document.getElementById('error-message')!;
const retryButton = document.getElementById('retry-button')!;

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

window.addEventListener('DOMContentLoaded', async () => {
  splashScreen.classList.add('active');

  const minimizeBtn = document.getElementById('minimize-btn')!;
  const maximizeBtn = document.getElementById('maximize-btn')!;
  const closeBtn = document.getElementById('close-btn')!;

  minimizeBtn.addEventListener('click', () => window.aiDesktop.minimize());
  maximizeBtn.addEventListener('click', () => window.aiDesktop.maximize());
  closeBtn.addEventListener('click', () => window.aiDesktop.close());

  categories = await window.aiDesktop.getServices();
  populateCategories();
});

function populateCategories(): void {
  categorySelect.innerHTML = '<option value="">Kategori Seç</option>';
  for (const cat of categories) {
    const option = document.createElement('option');
    option.value = cat.key;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  }

  categorySelect.addEventListener('change', () => {
    const key = categorySelect.value;
    populateServices(key);
  });

  serviceSelect.addEventListener('change', () => {
    const id = serviceSelect.value;
    if (id) {
      switchToService(id);
    }
  });
}

function populateServices(categoryKey: string): void {
  serviceSelect.innerHTML = '<option value="">Servis Seç</option>';
  const cat = categories.find(c => c.key === categoryKey);
  if (!cat) return;

  for (const svc of cat.services) {
    const option = document.createElement('option');
    option.value = svc.id;
    option.textContent = svc.name;
    serviceSelect.appendChild(option);
  }
}

function switchToService(serviceId: string): void {
  currentServiceId = serviceId;
  errorScreen.classList.add('hidden');
  splashScreen.classList.remove('done', 'hidden');
  splashScreen.classList.add('active');
  splashStatus.textContent = 'Bağlanıyor...';

  const svc = categories.flatMap(c => c.services).find(s => s.id === serviceId);
  if (svc) {
    splashSubtitle.textContent = svc.name;
    titlebarText.textContent = `AI Desktop - ${svc.name}`;
    document.title = `AI Desktop - ${svc.name}`;
  }

  window.aiDesktop.selectService(serviceId);
}

retryButton.addEventListener('click', () => {
  if (currentServiceId) {
    switchToService(currentServiceId);
  }
});
