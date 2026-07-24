import type { AIService, AIServiceCategory, TabInfo, Language } from '../shared/types';

export type ViewMode = 'home' | 'settings' | 'service';

export interface ServiceWithSearch extends AIService {
  nameLower: string;
}

export const CATEGORY_ICONS: Record<string, string> = {
  all: '🌟',
  favorites: '⭐',
  chat: '💬',
  writing: '✍️',
  image: '🎨',
  video: '🎬',
  audio: '🎙️',
  code: '💻',
  productivity: '⚡',
  research: '🔬',
  corporate: '🏢',
};
