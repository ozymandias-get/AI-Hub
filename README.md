# AI Hub

<div align="center">

**Türkçe • English** — İki dilli AI servis merkezi

![Electron](https://img.shields.io/badge/Electron-43+-47848F?logo=electron&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

**AI Hub** is a Windows desktop application that brings together 50+ AI services (ChatGPT, Claude, Perplexity, Midjourney, Bolt, and more) under one interface with **full bilingual support** (Turkish / English).

Tüm yapay zeka modelleriniz tek bir yerde — UI ve servis açıklamaları Türkçe veya İngilizce, dilediğiniz gibi.

![App Screenshot](docs/screenshots/dashboard.png)

## Features

- 🧠 **50+ AI Services** — Chat, writing, image, video, audio, code, productivity & research
- 🌐 **Bilingual UI** — Switch between Turkish & English at any time. All UI strings, category names, and 80+ service descriptions are fully translated
- 🌍 **Accept-Language Header** — Service websites automatically open in your selected language when supported
- ⭐ **Favorites** — Star your most-used services for quick access
- 🔍 **Search** — Find any service by name or description instantly
- ⌨️ **Global Hotkey** — Show/hide the app from anywhere (`Alt+Space` by default)
- 🖼️ **Frameless Glass UI** — Frosted matte dark glass design with spotlight hover effects
- 🔒 **Security First** — Sandboxed `WebContentsView`, `contextIsolation: true`, `nodeIntegration: false`
- 📥 **Download Management** — Automatic file downloads with Windows notifications
- 🎛️ **Persistent Settings** — Window size, position, zoom level, and language preference are saved
- 🛡️ **OAuth/SSO Ready** — Google, Apple, Microsoft, GitHub login support

## Quick Start

```bash
# Install dependencies
npm install

# Build & run
npm run dev
```

## Usage

### Language Switching

Open the dashboard and use the **🌐 App Language** dropdown to switch between Turkish and English. The setting is saved automatically — the app remembers your preference on next launch.

![Language Switcher](docs/screenshots/language-switch.png)

### Navigating Services

- **Dashboard**: Browse services by category or search by name
- **Click a card**: Launch the service in a secure embedded view
- **Back / Home buttons**: Navigate within services or return to dashboard
- **Star icon**: Add/remove services from favorites

### Global Shortcut

The default global hotkey is `Alt+Space`. Change it from the dashboard settings card.

## Build

```bash
# Build both main & renderer
npm run build

# Type-check all targets
npm run typecheck
```

## Package

```bash
# Standard Windows build
npm run dist

# Windows NSIS installer
npm run dist:installer
```

Outputs are written to the `release/` folder.

## Project Structure

```
src/
├── main/                  # Electron main process
│   ├── main.ts            # App bootstrap, single instance lock
│   ├── window-manager.ts  # Window creation & positioning
│   ├── service-view.ts    # WebContentsView lifecycle + Accept-Language
│   ├── services.ts        # AI service definitions & categories
│   ├── settings-store.ts  # Persistent settings (window, zoom, language)
│   ├── ipc.ts             # IPC handlers (services, language, shortcuts)
│   ├── navigation-policy.ts  # URL allowlist & external navigation
│   ├── permissions.ts     # Media & clipboard permission management
│   ├── downloads.ts       # File download handling & notifications
│   ├── menu.ts            # Application menu
│   ├── constants.ts       # App-wide constants
│   ├── app-state.ts       # Quit state tracking
│   └── tray.ts            # System tray integration
├── preload/
│   └── preload.ts         # Secure contextBridge API
└── renderer/
    ├── index.html         # Dashboard & splash screen UI
    ├── renderer.ts        # Dashboard logic, service cards, search
    ├── styles.css         # Frosted dark glass design system
    ├── translations.ts    # Full bilingual translation map (200+ keys)
    └── public/
        └── logos/         # Service logo icons
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Space` | Toggle app visibility (configurable) |
| `Ctrl+R` | Reload service |
| `Ctrl+Shift+R` | Reload ignoring cache |
| `Ctrl+=` / `Ctrl++` | Zoom in |
| `Ctrl+-` | Zoom out |
| `Ctrl+0` | Reset zoom |
| `F11` | Toggle fullscreen |
| `Alt+Left` | Go back |
| `Alt+Right` | Go forward |
| `Ctrl+Shift+I` | DevTools (development only) |
| `Ctrl+Q` | Quit |

## Adding a New Language

1. Edit `src/renderer/translations.ts` and add `'your_code'` entries to every key
2. Add the option to the `<select id="language-select">` in `index.html`
3. Update the `AppSettings.language` type in `settings-store.ts` to accept your new code
4. Update `currentLanguage` type in `service-view.ts`

## Tech Stack

- **Runtime**: [Electron 43](https://www.electronjs.org/)
- **Language**: [TypeScript 7](https://www.typescriptlang.org/)
- **Renderer Build**: [Vite 8](https://vitejs.dev/)
- **Main Build**: [tsup](https://tsup.egoist.dev/)
- **Packaging**: [electron-builder](https://www.electron.build/)

## Requirements

- Node.js 18+
- npm 9+

## License

MIT
