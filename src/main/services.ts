export interface AIService {
  id: string;
  name: string;
  url: string;
  category: string;
}

export interface AIServiceCategory {
  name: string;
  key: string;
  services: AIService[];
}

export const SERVICE_CATEGORIES: AIServiceCategory[] = [
  {
    name: 'Sohbet',
    key: 'chat',
    services: [
      { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', category: 'chat' },
      { id: 'claude', name: 'Claude', url: 'https://claude.ai', category: 'chat' },
      { id: 'perplexity', name: 'Perplexity AI', url: 'https://www.perplexity.ai', category: 'chat' },
      { id: 'copilot', name: 'Microsoft Copilot', url: 'https://copilot.microsoft.com', category: 'chat' },
      { id: 'grok', name: 'Grok', url: 'https://grok.com', category: 'chat' },
      { id: 'deepseek', name: 'DeepSeek Chat', url: 'https://chat.deepseek.com', category: 'chat' },
      { id: 'poe', name: 'Poe', url: 'https://poe.com', category: 'chat' },
      { id: 'lechat', name: 'Mistral Le Chat', url: 'https://chat.mistral.ai', category: 'chat' },
      { id: 'metaai', name: 'Meta AI', url: 'https://www.meta.ai', category: 'chat' },
      { id: 'qwen', name: 'Qwen Chat', url: 'https://chat.qwen.ai', category: 'chat' },
      { id: 'huggingchat', name: 'HuggingChat', url: 'https://huggingface.co/chat', category: 'chat' },
      { id: 'youcom', name: 'You.com', url: 'https://you.com', category: 'chat' },
      { id: 'phind', name: 'Phind', url: 'https://www.phind.com', category: 'chat' },
      { id: 'blackbox', name: 'Blackbox AI', url: 'https://www.blackbox.ai', category: 'chat' },
      { id: 'genspark', name: 'Genspark', url: 'https://genspark.ai', category: 'chat' },
      { id: 'felo', name: 'Felo AI', url: 'https://felo.ai', category: 'chat' },
      { id: 'kimi', name: 'Kimi AI', url: 'https://kimi.ai', category: 'chat' },
      { id: 'pi', name: 'Pi AI', url: 'https://pi.ai', category: 'chat' },
      { id: 'characterai', name: 'Character.AI', url: 'https://character.ai', category: 'chat' },
      { id: 'janitorai', name: 'Janitor AI', url: 'https://janitorai.com', category: 'chat' },
      { id: 'chubai', name: 'Chub AI', url: 'https://chub.ai', category: 'chat' },
    ],
  },
  {
    name: 'Görsel',
    key: 'image',
    services: [
      { id: 'midjourney', name: 'Midjourney', url: 'https://www.midjourney.com', category: 'image' },
      { id: 'leonardo', name: 'Leonardo AI', url: 'https://leonardo.ai', category: 'image' },
      { id: 'ideogram', name: 'Ideogram', url: 'https://ideogram.ai', category: 'image' },
      { id: 'playground', name: 'Playground AI', url: 'https://playground.com', category: 'image' },
      { id: 'firefly', name: 'Adobe Firefly', url: 'https://firefly.adobe.com', category: 'image' },
      { id: 'flux', name: 'FLUX Playground', url: 'https://flux1.ai', category: 'image' },
    ],
  },
  {
    name: 'Video',
    key: 'video',
    services: [
      { id: 'runway', name: 'Runway', url: 'https://runwayml.com', category: 'video' },
      { id: 'pika', name: 'Pika', url: 'https://pika.art', category: 'video' },
      { id: 'kling', name: 'Kling AI', url: 'https://klingai.com', category: 'video' },
      { id: 'hailuo', name: 'Hailuo AI', url: 'https://hailuoai.video', category: 'video' },
      { id: 'luma', name: 'Luma AI', url: 'https://lumalabs.ai', category: 'video' },
    ],
  },
  {
    name: 'Ses/Video Sentez',
    key: 'audio',
    services: [
      { id: 'heygen', name: 'HeyGen', url: 'https://www.heygen.com', category: 'audio' },
      { id: 'synthesia', name: 'Synthesia', url: 'https://www.synthesia.io', category: 'audio' },
      { id: 'elevenlabs', name: 'ElevenLabs', url: 'https://elevenlabs.io', category: 'audio' },
      { id: 'suno', name: 'Suno', url: 'https://suno.com', category: 'audio' },
      { id: 'udio', name: 'Udio', url: 'https://udio.com', category: 'audio' },
    ],
  },
  {
    name: 'Kod',
    key: 'code',
    services: [
      { id: 'bolt', name: 'Bolt.new', url: 'https://bolt.new', category: 'code' },
      { id: 'lovable', name: 'Lovable', url: 'https://lovable.dev', category: 'code' },
      { id: 'replit', name: 'Replit', url: 'https://replit.com', category: 'code' },
      { id: 'cursor', name: 'Cursor', url: 'https://cursor.com', category: 'code' },
      { id: 'windsurf', name: 'Windsurf', url: 'https://windsurf.com', category: 'code' },
      { id: 'codeium', name: 'Codeium', url: 'https://codeium.com', category: 'code' },
      { id: 'tabnine', name: 'Tabnine', url: 'https://www.tabnine.com', category: 'code' },
      { id: 'devin', name: 'Devin', url: 'https://devin.ai', category: 'code' },
      { id: 'openhands', name: 'OpenHands', url: 'https://openhands.dev', category: 'code' },
      { id: 'manus', name: 'Manus AI', url: 'https://manus.im', category: 'code' },
    ],
  },
  {
    name: 'Sunum/Üretkenlik',
    key: 'productivity',
    services: [
      { id: 'gamma', name: 'Gamma', url: 'https://gamma.app', category: 'productivity' },
      { id: 'napkin', name: 'Napkin AI', url: 'https://napkin.ai', category: 'productivity' },
      { id: 'mem', name: 'Mem.ai', url: 'https://mem.ai', category: 'productivity' },
    ],
  },
];

export function getAllServices(): AIService[] {
  return SERVICE_CATEGORIES.flatMap(c => c.services);
}

export function getServiceById(id: string): AIService | undefined {
  return getAllServices().find(s => s.id === id);
}

export function getDefaultService(): AIService {
  return { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', category: 'chat' };
}
