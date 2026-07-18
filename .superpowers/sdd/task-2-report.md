# Task 2 Report: Generalize chatgpt-view → service-view

## What I Implemented

Created `src/main/service-view.ts` as a generalized view system that works with any `AIService`, not just ChatGPT. Key exports:

- `getCurrentView()` / `getCurrentServiceId()` — state accessors
- `createServiceView(service: AIService)` — creates a WebContentsView for any service
- `loadServiceURL(service: AIService)` — navigates to the service's URL
- `reloadService(ignoreCache)` — reloads current view
- `goBack()` / `goForward()` — navigation history
- `zoomIn()` / `zoomOut()` / `zoomReset()` / `restoreZoomLevel()` — zoom controls
- `resizeViewToWindow(win)` — view sizing
- `switchToService(serviceId, win, settings)` — full service switching

## Files Changed

| File | Action |
|------|--------|
| `src/main/service-view.ts` | **Created** — generalized view module |
| `src/main/chatgpt-view.ts` | **Deleted** — old ChatGPT-specific view |
| `src/main/main.ts` | Updated imports to `./service-view`, uses `getDefaultService()` |
| `src/main/menu.ts` | Updated imports, `reloadChatGPT`→`reloadService`, service-based URL |
| `src/main/ipc.ts` | Updated imports, `getChatGPTView`→`getCurrentView`, service-based URL |
| `src/main/tray.ts` | Updated imports, `navigateToChatGPT`→service-based load |

## Test Results

```
npm run typecheck → PASS (all three tsconfigs)
```

## Self-Review Findings

- `tray.ts` also imported from `./chatgpt-view` and needed updating — was not listed in the brief but was required for typecheck to pass
- `CHATGPT_URL` constant remains in `constants.ts` — still used by `permissions.ts` and `preload.ts` for origin checking and renderer exposure; not in scope of this task
- `navigateToChatGPT` had no direct 1:1 replacement — replaced with service-based URL loading via `loadServiceURL(getCurrentServiceId/svc)`
