import type { Language } from '../../shared/types';
import { APP_CONSTANTS } from '../../shared/constants/app';
import { Logger } from '../../shared/utils/logger';

const LOG_TAG = 'StorageService';

const FAVORITES_KEY = APP_CONSTANTS.STORAGE_KEYS.FAVORITES;
const LANGUAGE_KEY = APP_CONSTANTS.STORAGE_KEYS.LANGUAGE;

export function loadFavorites(): Set<string> {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
      return new Set(JSON.parse(saved));
    }
  } catch (err) {
    Logger.warn(LOG_TAG, 'Failed to load favorites from localStorage', { err });
  }
  return new Set();
}

export function saveFavorites(favorites: Set<string>): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  } catch (err) {
    Logger.warn(LOG_TAG, 'Failed to save favorites to localStorage', { err });
  }
}

export function saveLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, lang);
  } catch (err) {
    Logger.warn(LOG_TAG, 'Failed to save language to localStorage', { err });
  }
}
