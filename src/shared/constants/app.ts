export const APP_CONSTANTS = {
  DEFAULT_LANGUAGE: 'tr' as const,
  DEFAULT_GLOBAL_SHORTCUT: 'Alt+Space',
  APP_USER_MODEL_ID: 'com.local.aihub',
  
  WINDOW: {
    MIN_WIDTH: 900,
    MIN_HEIGHT: 600,
    DEFAULT_WIDTH: 1280,
    DEFAULT_HEIGHT: 850,
    TITLE_BAR_HEIGHT: 38,
    RESIZE_DEBOUNCE_MS: 50,
    BACKGROUND_COLOR: '#08080a',
  },

  ZOOM: {
    MIN: 0.5,
    MAX: 3.0,
    STEP: 0.1,
    DEFAULT: 1.0,
  },

  STORAGE_KEYS: {
    FAVORITES: 'favorite_services',
    LANGUAGE: 'app_language',
    SETTINGS_FILENAME: 'app-settings.json',
  },

  SEARCH: {
    DEBOUNCE_MS: 150,
  },

  OVERLAY: {
    HIDE_SPLASH_DELAY_MS: 600,
    NOTICE_ANIMATION_MS: 250,
  },
} as const;
