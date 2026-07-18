### Task 4: Custom Title Bar (Renderer)

**Files:**
- Modify: `src/renderer/index.html`
- Modify: `src/renderer/renderer.ts`
- Modify: `src/renderer/styles.css`

**Interfaces:**
- Consumes: `window.aiDesktop` API from preload
- Produces: Title bar with category+service dropdown + window controls

- [ ] **Step 1: Update `src/renderer/index.html`**

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'">
  <title>AI Desktop</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <div id="titlebar" class="titlebar">
    <div class="titlebar-drag">
      <span class="titlebar-text">AI Desktop</span>
    </div>
    <div class="titlebar-controls">
      <select id="category-select" class="titlebar-select" aria-label="Kategori">
        <option value="">Kategori Seç</option>
      </select>
      <select id="service-select" class="titlebar-select" aria-label="Servis">
        <option value="">Servis Seç</option>
      </select>
      <div class="titlebar-btns">
        <button id="minimize-btn" class="titlebar-btn" title="Küçült">─</button>
        <button id="maximize-btn" class="titlebar-btn" title="Büyüt">□</button>
        <button id="close-btn" class="titlebar-btn titlebar-close" title="Kapat">✕</button>
      </div>
    </div>
  </div>

  <div id="content-area" class="content-area">
    <div id="splash-screen" class="active">
      <div class="splash-bg"></div>
      <div class="splash-content">
        <h1 class="splash-title">AI Desktop</h1>
        <p class="splash-subtitle" id="splash-subtitle">Yükleniyor...</p>
        <div class="splash-loader">
          <div class="splash-loader-track">
            <div class="splash-loader-bar"></div>
          </div>
        </div>
        <p class="splash-status" id="splash-status">Bağlanıyor...</p>
      </div>
    </div>

    <div id="error-screen" class="hidden">
      <div class="error-content">
        <h1>Bağlantı Hatası</h1>
        <p id="error-message">Servis yüklenirken bir hata oluştu.</p>
        <p class="error-hint">İnternet bağlantınızı kontrol edin veya farklı bir servis seçin.</p>
        <div class="error-actions">
          <button id="retry-button" class="btn btn-primary">Yeniden Dene</button>
        </div>
      </div>
    </div>
  </div>

  <script type="module" src="./renderer.js"></script>
</body>
</html>
```

- [ ] **Step 2: Update `src/renderer/renderer.ts`**

```typescript
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
```

- [ ] **Step 3: Update `src/renderer/styles.css`**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  background: #1a1a2e;
  color: #fff;
}

/* Title Bar */
.titlebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 38px;
  background: #16213e;
  display: flex;
  align-items: center;
  padding: 0 8px;
  z-index: 1000;
  user-select: none;
}

.titlebar-drag {
  -webkit-app-region: drag;
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  padding-right: 12px;
}

.titlebar-text {
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.titlebar-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.titlebar-select {
  background: #0f3460;
  color: #e0e0e0;
  border: 1px solid #1a4a8a;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
  max-width: 160px;
}

.titlebar-select:hover {
  border-color: #2a6ab0;
}

.titlebar-select:focus {
  border-color: #4a90d9;
}

.titlebar-btns {
  display: flex;
  align-items: center;
  margin-left: 4px;
}

.titlebar-btn {
  background: none;
  border: none;
  color: #a0a0a0;
  width: 36px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  font-family: 'Segoe UI', Arial, sans-serif;
  transition: background 0.15s, color 0.15s;
}

.titlebar-btn:hover {
  background: #2a2a4a;
  color: #fff;
}

.titlebar-close:hover {
  background: #e81123;
  color: #fff;
}

/* Content Area */
.content-area {
  position: absolute;
  top: 38px;
  left: 0;
  right: 0;
  bottom: 0;
}

/* Splash Screen */
#splash-screen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  z-index: 100;
  transition: opacity 0.4s ease;
}

#splash-screen.hidden {
  display: none;
}

#splash-screen.done {
  opacity: 0;
}

.splash-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, #16213e 0%, #1a1a2e 70%);
}

.splash-content {
  position: relative;
  text-align: center;
  z-index: 1;
}

.splash-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #4a90d9, #6c5ce7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.splash-subtitle {
  font-size: 14px;
  color: #888;
  margin-bottom: 24px;
}

.splash-loader {
  margin: 0 auto 12px;
  width: 200px;
}

.splash-loader-track {
  height: 3px;
  background: #2a2a4a;
  border-radius: 2px;
  overflow: hidden;
}

.splash-loader-bar {
  width: 30%;
  height: 100%;
  background: linear-gradient(90deg, #4a90d9, #6c5ce7);
  border-radius: 2px;
  animation: loader 1.5s ease-in-out infinite;
}

@keyframes loader {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

.splash-status {
  font-size: 12px;
  color: #666;
}

/* Error Screen */
#error-screen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  z-index: 100;
}

#error-screen.hidden {
  display: none;
}

.error-content {
  text-align: center;
  max-width: 400px;
  padding: 24px;
}

.error-content h1 {
  font-size: 22px;
  margin-bottom: 8px;
}

#error-message {
  color: #e74c3c;
  margin-bottom: 8px;
  font-size: 14px;
}

.error-hint {
  color: #888;
  font-size: 13px;
  margin-bottom: 20px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary {
  background: #4a90d9;
  color: #fff;
}

.btn-primary:hover {
  background: #357abd;
}

.btn-secondary {
  background: #2a2a4a;
  color: #e0e0e0;
}

.btn-secondary:hover {
  background: #3a3a5a;
}
```

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add src/renderer/index.html src/renderer/renderer.ts src/renderer/styles.css
git commit -m "feat: custom title bar with service dropdown"
```

---

