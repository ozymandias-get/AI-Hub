export const IPC_CHANNELS = {
  // Application & System
  GET_LANGUAGE: 'get-language',
  SET_LANGUAGE: 'set-language',
  GET_GLOBAL_SHORTCUT: 'get-global-shortcut',
  SET_GLOBAL_SHORTCUT: 'set-global-shortcut',
  GET_AUTO_LAUNCH: 'get-auto-launch',
  SET_AUTO_LAUNCH: 'set-auto-launch',
  OPEN_EXTERNAL: 'open-external',

  // Window Controls
  WINDOW_MINIMIZE: 'window-minimize',
  WINDOW_MAXIMIZE: 'window-maximize',
  WINDOW_CLOSE: 'window-close',
  MAXIMIZE_STATE: 'maximize-state',

  // Service Management
  GET_SERVICES: 'get-services',
  GET_CURRENT_SERVICE_ID: 'get-current-service-id',
  IS_SERVICE_LOADING: 'is-service-loading',
  SERVICE_SELECT: 'service-select',
  SHOW_HOMEPAGE: 'show-homepage',
  GO_BACK: 'go-back',
  RETRY_LOAD: 'retry-load',
  UPDATE_SERVICE_UI: 'update-service-ui',

  // Loading Events
  SERVICE_LOADING_START: 'service-loading-start',
  SERVICE_LOADING_STOP: 'service-loading-stop',
  SERVICE_LOADING_ERROR: 'service-loading-error',

  // Multi-Tab Management
  GET_TABS_STATE: 'get-tabs-state',
  CREATE_TAB: 'create-tab',
  SWITCH_TAB: 'switch-tab',
  CLOSE_TAB: 'close-tab',
  OPEN_SERVICE_IN_TAB: 'open-service-in-tab',
  TABS_UPDATED: 'tabs-updated',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
