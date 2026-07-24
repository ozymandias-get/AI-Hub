import { translations, type Language } from '../translations';

let currentLanguage: Language = 'tr';
const serviceDescriptionsLower: Record<string, string> = {};

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export function setCurrentLanguage(lang: Language): void {
  currentLanguage = lang;
  rebuildDescriptionsLower();
}

export function t(key: string): string {
  return translations[key]?.[currentLanguage] ?? key;
}

export function getServiceDesc(id: string): string {
  const key = `desc.${id}`;
  return translations[key]?.[currentLanguage] ?? '';
}

export function getCategoryName(key: string): string {
  return t(`category.${key}`);
}

export function rebuildDescriptionsLower(): void {
  for (const [key, value] of Object.entries(translations)) {
    if (key.startsWith('desc.')) {
      serviceDescriptionsLower[key.slice(5)] = value[currentLanguage].toLowerCase();
    }
  }
}

export function getServiceDescLower(id: string): string {
  return serviceDescriptionsLower[id] ?? '';
}
