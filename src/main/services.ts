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
    name: 'Yazı & İçerik',
    key: 'writing',
    services: [
      { id: 'jasper', name: 'Jasper', url: 'https://www.jasper.ai', category: 'writing' },
      { id: 'copyai', name: 'Copy.ai', url: 'https://www.copy.ai', category: 'writing' },
      { id: 'writesonic', name: 'Writesonic', url: 'https://writesonic.com', category: 'writing' },
      { id: 'grammarly', name: 'Grammarly', url: 'https://www.grammarly.com', category: 'writing' },
      { id: 'quillbot', name: 'QuillBot', url: 'https://quillbot.com', category: 'writing' },
      { id: 'wordtune', name: 'Wordtune', url: 'https://www.wordtune.com', category: 'writing' },
      { id: 'rytr', name: 'Rytr', url: 'https://rytr.me', category: 'writing' },
      { id: 'sudowrite', name: 'Sudowrite', url: 'https://www.sudowrite.com', category: 'writing' },
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
      { id: 'krea', name: 'Krea AI', url: 'https://www.krea.ai', category: 'image' },
      { id: 'dreamstudio', name: 'DreamStudio', url: 'https://dreamstudio.ai', category: 'image' },
      { id: 'nightcafe', name: 'NightCafe', url: 'https://nightcafe.studio', category: 'image' },
      { id: 'civitai', name: 'Civitai', url: 'https://civitai.com', category: 'image' },
      { id: 'clipdrop', name: 'Clipdrop', url: 'https://clipdrop.co', category: 'image' },
      { id: 'photoroom', name: 'Photoroom', url: 'https://www.photoroom.com', category: 'image' },
      { id: 'magnific', name: 'Magnific AI', url: 'https://magnific.ai', category: 'image' },
      { id: 'freepikai', name: 'Freepik AI', url: 'https://www.freepik.com/ai', category: 'image' },
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
      { id: 'heygen', name: 'HeyGen', url: 'https://www.heygen.com', category: 'video' },
      { id: 'synthesia', name: 'Synthesia', url: 'https://www.synthesia.io', category: 'video' },
      { id: 'invideo', name: 'InVideo AI', url: 'https://invideo.io/ai', category: 'video' },
      { id: 'veed', name: 'VEED AI', url: 'https://www.veed.io/tools/ai', category: 'video' },
      { id: 'kapwing', name: 'Kapwing AI', url: 'https://www.kapwing.com/ai', category: 'video' },
      { id: 'opusclip', name: 'OpusClip', url: 'https://www.opus.pro', category: 'video' },
      { id: 'captions', name: 'Captions', url: 'https://www.captions.ai', category: 'video' },
      { id: 'did', name: 'D-ID', url: 'https://www.d-id.com', category: 'video' },
      { id: 'colossyan', name: 'Colossyan', url: 'https://www.colossyan.com', category: 'video' },
      { id: 'fliki', name: 'Fliki', url: 'https://fliki.ai', category: 'video' },
      { id: 'kaiber', name: 'Kaiber', url: 'https://kaiber.ai', category: 'video' },
    ],
  },
  {
    name: 'Ses & Müzik',
    key: 'audio',
    services: [
      { id: 'elevenlabs', name: 'ElevenLabs', url: 'https://elevenlabs.io', category: 'audio' },
      { id: 'suno', name: 'Suno', url: 'https://suno.com', category: 'audio' },
      { id: 'udio', name: 'Udio', url: 'https://udio.com', category: 'audio' },
      { id: 'descript', name: 'Descript', url: 'https://www.descript.com', category: 'audio' },
      { id: 'krisp', name: 'Krisp', url: 'https://krisp.ai', category: 'audio' },
      { id: 'adobepodcast', name: 'Adobe Podcast', url: 'https://podcast.adobe.com', category: 'audio' },
      { id: 'murf', name: 'Murf AI', url: 'https://murf.ai', category: 'audio' },
      { id: 'speechify', name: 'Speechify', url: 'https://speechify.com', category: 'audio' },
      { id: 'lovo', name: 'LOVO AI', url: 'https://lovo.ai', category: 'audio' },
      { id: 'resemble', name: 'Resemble AI', url: 'https://www.resemble.ai', category: 'audio' },
      { id: 'aiva', name: 'AIVA', url: 'https://www.aiva.ai', category: 'audio' },
      { id: 'soundraw', name: 'Soundraw', url: 'https://soundraw.io', category: 'audio' },
      { id: 'boomy', name: 'Boomy', url: 'https://boomy.com', category: 'audio' },
      { id: 'beatoven', name: 'Beatoven.ai', url: 'https://www.beatoven.ai', category: 'audio' },
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
      { id: 'githubcopilot', name: 'GitHub Copilot', url: 'https://github.com/features/copilot', category: 'code' },
      { id: 'amazonq', name: 'Amazon Q Developer', url: 'https://aws.amazon.com/q/developer', category: 'code' },
      { id: 'jetbrainsai', name: 'JetBrains AI Assistant', url: 'https://www.jetbrains.com/ai', category: 'code' },
    ],
  },
  {
    name: 'Sunum & Üretkenlik',
    key: 'productivity',
    services: [
      { id: 'gamma', name: 'Gamma', url: 'https://gamma.app', category: 'productivity' },
      { id: 'napkin', name: 'Napkin AI', url: 'https://napkin.ai', category: 'productivity' },
      { id: 'mem', name: 'Mem.ai', url: 'https://mem.ai', category: 'productivity' },
      { id: 'notionai', name: 'Notion AI', url: 'https://www.notion.so/product/ai', category: 'productivity' },
      { id: 'canvamagic', name: 'Canva Magic Studio', url: 'https://www.canva.com/magic-studio', category: 'productivity' },
      { id: 'figmaai', name: 'Figma AI', url: 'https://www.figma.com/ai', category: 'productivity' },
      { id: 'otter', name: 'Otter.ai', url: 'https://otter.ai', category: 'productivity' },
      { id: 'fireflies', name: 'Fireflies.ai', url: 'https://fireflies.ai', category: 'productivity' },
    ],
  },
  {
    name: 'Araştırma & Akademik',
    key: 'research',
    services: [
      { id: 'researchrabbit', name: 'ResearchRabbit', url: 'https://www.researchrabbit.ai', category: 'research' },
      { id: 'connectedpapers', name: 'Connected Papers', url: 'https://www.connectedpapers.com', category: 'research' },
      { id: 'elicit', name: 'Elicit', url: 'https://elicit.com', category: 'research' },
      { id: 'consensus', name: 'Consensus', url: 'https://consensus.app', category: 'research' },
      { id: 'scite', name: 'Scite', url: 'https://scite.ai', category: 'research' },
      { id: 'scispace', name: 'SciSpace', url: 'https://scispace.com', category: 'research' },
    ],
  },
];

// Cached flat list and lookup map — computed once, O(1) lookups
let _allServicesCache: AIService[] | null = null;
let _serviceMapCache: Map<string, AIService> | null = null;

export function getAllServices(): AIService[] {
  if (!_allServicesCache) {
    _allServicesCache = SERVICE_CATEGORIES.flatMap(c => c.services);
  }
  return _allServicesCache;
}

export function getServiceById(id: string): AIService | undefined {
  if (!_serviceMapCache) {
    _serviceMapCache = new Map(getAllServices().map(s => [s.id, s]));
  }
  return _serviceMapCache.get(id);
}

export function getDefaultService(): AIService {
  return { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', category: 'chat' };
}
