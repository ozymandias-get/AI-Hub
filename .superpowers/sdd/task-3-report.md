# Task 3 Report: Frameless Window + IPC Handlers + Preload

## Status: DONE

## Changes Made

- **src/main/window-manager.ts** — Added `frame: false, titleBarStyle: 'hidden'` to `createMainWindow` options
- **src/main/ipc.ts** — Rewritten with new IPC handlers: `window-minimize`, `window-maximize`, `window-close`, `get-services`, `retry-load`, `service-select`, `open-external`. Added `setIpcSettings()` and `BrowserWindow` import. Uses `getServiceById` for `retry-load`.
- **src/preload/preload.ts** — Replaced `chatgptDesktop` with `aiDesktop` API exposing `getServices`, `minimize`, `maximize`, `close`, `selectService`, `retryLoad`, `openExternal`
- **src/renderer/global.d.ts** — Added `AiDesktopAPI` interface and `aiDesktop` on `Window`, kept `chatgptDesktop: any` for backward compat

## Typecheck: PASS

## Commit

`9b8829c` — `feat: frameless window, new IPC handlers, preload API`
