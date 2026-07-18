# AI Desktop - Design Document

## 1. Overview

Transform the existing ChatGPT Desktop Electron app into **AI Desktop** — a multi-service
launcher that lets users switch between 49 different AI web services via a single-window
interface, with only one service active at a time.

## 2. Name Change

| Location | Old Value | New Value |
|---|---|---|
| `package.json` name | `chatgpt-desktop` | `ai-desktop` |
| `package.json` description | `ChatGPT Desktop Application` | `AI Desktop Application` |
| `electron-builder.yml` productName | `ChatGPT Desktop` | `AI Desktop` |
| `electron-builder.yml` appId | `com.local.chatgptdesktop` | `com.local.aidesktop` |
| `electron-builder.yml` shortcutName | `ChatGPT Desktop` | `AI Desktop` |
| `electron-builder.yml` artifactName | `ChatGPT-Desktop-Setup-*.exe` | `AI-Desktop-Setup-*.exe` |
| `constants.ts` APP_USER_MODEL_ID | `com.local.chatgptdesktop` | `com.local.aidesktop` |
| Window title (dynamic) | `ChatGPT Desktop` | `AI Desktop - {Service Name}` |
| Tray tooltip | `ChatGPT Desktop` | `AI Desktop` |
| Index.html title | `ChatGPT Desktop` | `AI Desktop` |
| Splash screen text | "ChatGPT" / "Masaüstü Uygulaması" | "AI Desktop" / {Service Name} |

## 3. Custom Title Bar

### 3.1 Window Configuration
- `frame: false` — remove native title bar
- `titleBarStyle: 'hidden'` — hide native bar on macOS
- Render custom title bar in the renderer process

### 3.2 Title Bar Layout (left to right)
```
[App Icon]  AI Desktop - {Service Name}  |  [Category ▼] [Service ▼]  |  [─] [□] [✕]
  ^-- drag region                          ^-- dropdown                   ^-- window controls
```

- **Left**: App icon (16x16) + "AI Desktop - {Service Name}" text. `-webkit-app-region: drag`
- **Center**: Category dropdown + Service dropdown side by side
- **Right**: Minimize, Maximize/Restore, Close buttons (rendered via IPC or `BrowserWindow` APIs)
- Height: ~38px

### 3.3 Window Controls
- Minimize, Maximize/Restore, Close buttons rendered in the title bar
- Click events sent to main process via IPC
- Double-click on title bar toggles maximize

## 4. Service Categories and URLs

Organized into 6 categories:

### Sohbet
1. ChatGPT — `https://chatgpt.com`
2. Claude — `https://claude.ai`
3. Perplexity AI — `https://www.perplexity.ai`
4. Microsoft Copilot — `https://copilot.microsoft.com`
5. Grok — `https://grok.com`
6. DeepSeek Chat — `https://chat.deepseek.com`
7. Poe — `https://poe.com`
8. Mistral Le Chat — `https://chat.mistral.ai`
9. Meta AI — `https://www.meta.ai`
10. Qwen Chat — `https://chat.qwen.ai`
11. HuggingChat — `https://huggingface.co/chat`
12. You.com — `https://you.com`
13. Phind — `https://www.phind.com`
14. Blackbox AI — `https://www.blackbox.ai`
15. Genspark — `https://genspark.ai`
16. Felo AI — `https://felo.ai`
17. Kimi AI — `https://kimi.ai`
18. Pi AI — `https://pi.ai`
19. Character.AI — `https://character.ai`
20. Janitor AI — `https://janitorai.com`
21. Chub AI — `https://chub.ai`

### Görsel
22. Midjourney — `https://www.midjourney.com`
23. Leonardo AI — `https://leonardo.ai`
24. Ideogram — `https://ideogram.ai`
25. Playground AI — `https://playground.com`
26. Adobe Firefly — `https://firefly.adobe.com`
27. FLUX Playground — `https://flux1.ai`

### Video
28. Runway — `https://runwayml.com`
29. Pika — `https://pika.art`
30. Kling AI — `https://klingai.com`
31. Hailuo AI — `https://hailuoai.video`
32. Luma AI — `https://lumalabs.ai`

### Ses/Video Sentez
33. HeyGen — `https://www.heygen.com`
34. Synthesia — `https://www.synthesia.io`
35. ElevenLabs — `https://elevenlabs.io`
36. Suno — `https://suno.com`
37. Udio — `https://udio.com`

### Kod
38. Bolt.new — `https://bolt.new`
39. Lovable — `https://lovable.dev`
40. Replit — `https://replit.com`
41. Cursor — `https://cursor.com`
42. Windsurf — `https://windsurf.com`
43. Codeium — `https://codeium.com`
44. Tabnine — `https://www.tabnine.com`
45. Devin — `https://devin.ai`
46. OpenHands — `https://openhands.dev`
47. Manus AI — `https://manus.im`

### Sunum/Üretkenlik
48. Gamma — `https://gamma.app`
49. Napkin AI — `https://napkin.ai`
50. Mem.ai — `https://mem.ai`

## 5. Service Switching (Single Active Model)

### 5.1 Flow
1. User selects a category from first dropdown
2. Second dropdown populates with services in that category
3. User selects a service
4. Current `WebContentsView` is destroyed
5. New `WebContentsView` is created with the selected URL
6. Loading splash is shown
7. Window title updates to "AI Desktop - {Service Name}"
8. On successful load, view is attached to window
9. On failure, error screen with option to switch services

### 5.2 Persistence
- Last active service is saved to settings (`app-settings.json`)
- On app launch, last service is loaded automatically
- Zoom level is saved per-service (future enhancement, initially global)

### 5.3 Constraints
- Only ONE `WebContentsView` exists at any time
- Switching destroys the previous view completely (no cache of previous sessions)
- Navigation history is not preserved across switches

## 6. Menu Updates

- **Uygulama** menu: "AI Desktop Ana Sayfası" removed. Replace with "Servis Değiştir" (Ctrl+L → focus dropdown)
- **Servisler** menu: All 50 services listed under category submenus (redundant with dropdown but accessible via keyboard)
- **Görünüm**, **Gezinme**, **Yardım**, **Geliştirme**: unchanged

## 7. Tray Updates

- Tooltip: `AI Desktop`
- Context menu: Add "Servis Değiştir" option
- Keep existing "Uygulamayı Göster" and "Çıkış"

## 8. Files to Modify

| File | Change |
|---|---|
| `package.json` | name, description, author |
| `electron-builder.yml` | productName, appId, shortcutName, artifactName |
| `src/main/constants.ts` | CHATGPT_URL → SERVICES list, APP_USER_MODEL_ID |
| `src/main/main.ts` | Remove single-view setup, add service switching logic |
| `src/main/window-manager.ts` | frame: false, titleBarStyle |
| `src/main/chatgpt-view.ts` | Rename to `service-view.ts`, generalize for any URL |
| `src/main/menu.ts` | Update menu items, add Servisler menu |
| `src/main/tray.ts` | Update tooltip, add service switching |
| `src/main/settings-store.ts` | Add `lastService` to settings schema |
| `src/main/ipc.ts` | Add handlers for service switching, window controls |
| `src/preload/preload.ts` | Expose service list, switching API |
| `src/renderer/index.html` | Custom title bar HTML, service dropdown markup |
| `src/renderer/renderer.ts` | Title bar logic, dropdown interactions, window controls |
| `src/renderer/styles.css` | Title bar styles |

## 9. New Files

| File | Purpose |
|---|---|
| `src/main/services.ts` | Service definitions (categories, names, URLs) |

## 10. Technology Decisions

- **No external UI framework** — vanilla HTML/CSS/JS for the title bar (keeps it lightweight)
- **IPC-based window controls** — minimize/maximize/close via `ipcRenderer.send`
- **CSS `-webkit-app-region`** — for drag region on title bar
- **No runtime state sharing** — each service is a fresh `WebContentsView`
