<p align="center">
  <img src="assets/icon.png" alt="AI Hub" width="128" />
</p>

<h1 align="center">AI Hub</h1>

<p align="center">
  <strong>Türkçe • English</strong> — İki dilli AI servis merkezi
  <br />
  Windows ve Linux için 50+ yapay zeka hizmetini tek çatı altında toplayan masaüstü uygulaması
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-43+-47848F?logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/build-passing-22c55e" alt="Build" />
  <img src="https://img.shields.io/badge/license-MIT-6b7280" alt="License" />
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20Linux-0ea5e9" alt="Platform" />
</p>

<br />

## ✨ Özellikler / Features

<table>
<tr>
<td width="50%" valign="top">

### 🧠 50+ AI Service
Tek bir arayüzden ChatGPT, Claude, Perplexity, Midjourney, Gemini, DeepSeek, Bolt, Cursor ve daha fazlasına erişin. Tüm servisler kategorilere ayrılmış ve aranabilir.

</td>
<td width="50%" valign="top">

### 🌐 Bilingual UI
Turkish / English — Switch instantly between languages from the dashboard. Every UI string, category name, and service description is fully translated. Language preference is saved automatically.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🌍 Smart Language Header
Servis websitesi dilinizi destekliyorsa, otomatik olarak seçtiğiniz dilde açılır. Accept-Language HTTP header'ı tercihinize göre ayarlanır.

</td>
<td width="50%" valign="top">

### ⭐ Favorites & Search
En sık kullandığınız servisleri yıldızlayın, ad veya açıklama ile anında arayın. Sık kullanılanlar her zaman üstte görünür.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### ⌨️ Global Hotkey
Uygulamayı her yerden `Alt+Space` ile açıp kapatın. Kısayol dashboard ayarlarından değiştirilebilir.

</td>
<td width="50%" valign="top">

### 🖼️ Frosted Glass UI
Frameless buzlu cam tasarım, koyu tema, spotlight hover efektleri ve akıcı animasyonlar. Modern ve şık bir arayüz.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🔒 Security First
Her servis ayrı WebContentsView'de çalışır. `contextIsolation: true`, `nodeIntegration: false` ile güvenlik en üst seviyede.

</td>
<td width="50%" valign="top">

### 📥 Advanced Download Manager
Dosya indirmeleri otomatik yakalanır, Windows bildirimleri gösterilir. İndirme ilerlemesi gerçek zamanlı takip edilir.

</td>
</tr>
</table>

<br />

## 🚀 Hızlı Başlangıç / Quick Start

```bash
# Bağımlılıkları yükle / Install dependencies
npm install

# Derle ve çalıştır / Build & run
npm run dev
```

<br />

## 📦 Komutlar / Commands

| Komut | Açıklama | Description |
|-------|----------|-------------|
| `npm run dev` | Derle ve çalıştır | Build & launch |
| `npm run build` | Tüm projeyi derle | Build all targets |
| `npm run typecheck` | Tip kontrolü | Type-check |
| `npm run dist` | Windows paketle | Package for Windows |
| `npm run dist:linux` | Linux paketle | Package for Linux |
| `npm run clean` | Dist klasörünü temizle | Clean dist folder |

<br />

## 🗂️ Proje Yapısı / Project Structure

```
ai-hub/
│
├── src/
│   ├── main/                     # Electron main process
│   │   ├── main.ts               # App bootstrap, single instance, context menu
│   │   ├── window-manager.ts     # Pencere oluşturma / Window creation
│   │   ├── service-view.ts       # WebContentsView yönetimi + Accept-Language
│   │   ├── services.ts           # 50+ AI servis tanımı / Service definitions
│   │   ├── settings-store.ts     # Ayarlar (pencere, zoom, dil) / Persistent settings
│   │   ├── ipc.ts                # IPC kanalları / IPC handlers
│   │   ├── navigation-policy.ts  # URL izin listesi / URL allowlist
│   │   ├── permissions.ts        # İzin yönetimi / Permission management
│   │   ├── downloads.ts          # Dosya indirme / Download handling
│   │   ├── menu.ts               # Uygulama menüsü / Application menu
│   │   ├── constants.ts          # Sabitler / Constants
│   │   ├── app-state.ts          # Çıkış durumu / Quit state
│   │   └── tray.ts               # Sistem tepsisi / System tray
│   │
│   ├── preload/
│   │   └── preload.ts            # contextBridge API (güvenli köprü)
│   │
│   ├── renderer/
│   │   ├── index.html            # Dashboard + splash UI
│   │   ├── renderer.ts           # Dashboard mantığı, kartlar, arama
│   │   ├── styles.css            # Buzlu cam tasarım / Frosted glass design
│   │   ├── translations.ts       # 200+ anahtar ile tam çeviri haritası
│   │   └── public/logos/         # Servis logoları (60+ adet)
│   │
│   └── assets/                   # Uygulama ikonları / App icons
│
├── .github/workflows/            # GitHub Actions CI/CD
├── electron-builder.yml          # Paketleme yapılandırması
├── package.json
├── tsconfig.json
└── vite.config.renderer.ts
```

<br />

## 🧩 Servis Kategorileri / Service Categories

<details>
<summary><b>💬 Sohbet / Chat</b> <code>21 servis</code></summary>

| # | Servis | Açıklama |
|---|--------|----------|
| 1 | [**ChatGPT**](https://chatgpt.com) <br> <sub><code>chatgpt.com</code></sub> | OpenAI'nin amiral gemisi yapay zeka sohbet asistanı |
| 2 | [**Claude**](https://claude.ai) <br> <sub><code>claude.ai</code></sub> | Anthropic'in güvenlik odaklı yapay zeka asistanı |
| 3 | [**Perplexity AI**](https://www.perplexity.ai) <br> <sub><code>perplexity.ai</code></sub> | Gerçek zamanlı kaynak gösterimi yapan araştırma asistanı |
| 4 | [**Microsoft Copilot**](https://copilot.microsoft.com) <br> <sub><code>copilot.microsoft.com</code></sub> | Windows ve Edge entegre AI asistanı |
| 5 | [**Grok**](https://grok.com) <br> <sub><code>grok.com</code></sub> | xAI tarafından geliştirilen gerçek zamanlı bilgiye sahip AI asistanı |
| 6 | [**DeepSeek Chat**](https://chat.deepseek.com) <br> <sub><code>chat.deepseek.com</code></sub> | Gelişmiş mantık ve kodlama yeteneklerine sahip Çin yapımı AI |
| 7 | [**Poe**](https://poe.com) <br> <sub><code>poe.com</code></sub> | Quora'nın çoklu AI model platformu |
| 8 | [**Mistral Le Chat**](https://chat.mistral.ai) <br> <sub><code>chat.mistral.ai</code></sub> | Mistral AI'nin hızlı ve güçlü sohbet asistanı |
| 9 | [**Meta AI**](https://www.meta.ai) <br> <sub><code>meta.ai</code></sub> | Meta'nın sosyal medya entegre yapay zeka asistanı |
| 10 | [**Qwen Chat**](https://chat.qwen.ai) <br> <sub><code>chat.qwen.ai</code></sub> | Alibaba'nın çok amaçlı yapay zeka modeli |
| 11 | [**HuggingChat**](https://huggingface.co/chat) <br> <sub><code>huggingface.co/chat</code></sub> | Açık kaynak yapay zeka modelleri için topluluk sohbet arayüzü |
| 12 | [**You.com**](https://you.com) <br> <sub><code>you.com</code></sub> | Yapay zeka destekli özel kodlama arama motoru |
| 13 | [**Phind**](https://www.phind.com) <br> <sub><code>phind.com</code></sub> | Teknik sorular için AI kod ve geliştirme arama motoru |
| 14 | [**Blackbox AI**](https://www.blackbox.ai) <br> <sub><code>blackbox.ai</code></sub> | Kod oluşturma, hata ayıklama ve açıklama için AI asistanı |
| 15 | [**Genspark**](https://genspark.ai) <br> <sub><code>genspark.ai</code></sub> | Doğru ve farklı bakış açıları sunan AI arama motoru |
| 16 | [**Felo AI**](https://felo.ai) <br> <sub><code>felo.ai</code></sub> | Yapay zeka destekli yabancı dil öğrenme ve çeviri platformu |
| 17 | [**Kimi AI**](https://kimi.ai) <br> <sub><code>kimi.ai</code></sub> | Moonshot AI'nin uzun bağlam pencereli Çin yapımı asistanı |
| 18 | [**Pi AI**](https://pi.ai) <br> <sub><code>pi.ai</code></sub> | Kişisel ve destekleyici sohbetler için Inflection AI asistanı |
| 19 | [**Character.AI**](https://character.ai) <br> <sub><code>character.ai</code></sub> | Kişiselleştirilmiş karakterlerle sohbet platformu |
| 20 | [**Janitor AI**](https://janitorai.com) <br> <sub><code>janitorai.com</code></sub> | Kısıtlama olmadan karakter yapay zeka sohbetleri |
| 21 | [**Chub AI**](https://chub.ai) <br> <sub><code>chub.ai</code></sub> | NSFW dahil filtrelemesiz karakter sohbet platformu |

</details>

<details>
<summary><b>✍️ Yazma / Writing</b> <code>8 servis</code></summary>

| # | Servis | Açıklama |
|---|--------|----------|
| 1 | [**Jasper**](https://www.jasper.ai) <br> <sub><code>jasper.ai</code></sub> | Markalar için kurumsal seviyede AI içerik platformu |
| 2 | [**Copy.ai**](https://www.copy.ai) <br> <sub><code>copy.ai</code></sub> | Pazarlama metinleri ve içerik üretimi için AI asistanı |
| 3 | [**Writesonic**](https://writesonic.com) <br> <sub><code>writesonic.com</code></sub> | SEO odaklı içerik üretimi ve yeniden yazma aracı |
| 4 | [**Grammarly**](https://www.grammarly.com) <br> <sub><code>grammarly.com</code></sub> | Gelişmiş dil bilgisi, imla ve ton düzeltme asistanı |
| 5 | [**QuillBot**](https://quillbot.com) <br> <sub><code>quillbot.com</code></sub> | Metin açımlama ve intihal önleme aracı |
| 6 | [**Wordtune**](https://www.wordtune.com) <br> <sub><code>wordtune.com</code></sub> | Cümleleri yeniden ifade etme ve iyileştirme asistanı |
| 7 | [**Rytr**](https://rytr.me) <br> <sub><code>rytr.me</code></sub> | Blog yazıları ve sosyal medya içerikleri için uygun fiyatlı AI yazar |
| 8 | [**Sudowrite**](https://www.sudowrite.com) <br> <sub><code>sudowrite.com</code></sub> | Roman ve hikaye yazarları için yaratıcı yazma asistanı |

</details>

<details>
<summary><b>🖼️ Görsel / Image</b> <code>14 servis</code></summary>

| # | Servis | Açıklama |
|---|--------|----------|
| 1 | [**Midjourney**](https://www.midjourney.com) <br> <sub><code>midjourney.com</code></sub> | Sanatsal ve yaratıcı görseller üreten lider AI görsel platformu |
| 2 | [**Leonardo AI**](https://leonardo.ai) <br> <sub><code>leonardo.ai</code></sub> | Oyun varlıkları ve konsept sanat için güçlü AI üretici |
| 3 | [**Ideogram**](https://ideogram.ai) <br> <sub><code>ideogram.ai</code></sub> | Logolar ve tipografi konusunda üstün metinden görüntüye üretici |
| 4 | [**Playground AI**](https://playground.com) <br> <sub><code>playground.com</code></sub> | Görsel düzenleme için sezgisel arayüzlü AI görsel üretici |
| 5 | [**Adobe Firefly**](https://firefly.adobe.com) <br> <sub><code>firefly.adobe.com</code></sub> | Adobe ekosistemi ile entegre üretken yapay zeka |
| 6 | [**FLUX Playground**](https://flux1.ai) <br> <sub><code>flux1.ai</code></sub> | Son teknoloji metinden görüntüye modeli |
| 7 | [**Krea AI**](https://www.krea.ai) <br> <sub><code>krea.ai</code></sub> | Gerçek zamanlı AI görsel üretim ve düzenleme platformu |
| 8 | [**DreamStudio**](https://dreamstudio.ai) <br> <sub><code>dreamstudio.ai</code></sub> | Stability AI'nin metinden görüntüye üretim arayüzü |
| 9 | [**NightCafe**](https://nightcafe.studio) <br> <sub><code>nightcafe.studio</code></sub> | Çeşitli AI sanat stilleri sunan topluluk odaklı platform |
| 10 | [**Civitai**](https://civitai.com) <br> <sub><code>civitai.com</code></sub> | Stable Diffusion modelleri için topluluk platformu |
| 11 | [**Clipdrop**](https://clipdrop.co) <br> <sub><code>clipdrop.co</code></sub> | Stability AI'nin AI düzenleme ve arka plan kaldırma aracı |
| 12 | [**Photoroom**](https://www.photoroom.com) <br> <sub><code>photoroom.com</code></sub> | AI destekli ürün fotoğrafı düzenleme |
| 13 | [**Magnific AI**](https://magnific.ai) <br> <sub><code>magnific.ai</code></sub> | AI görsellerini yüksek çözünürlüğe yükseltme ve iyileştirme |
| 14 | [**Freepik AI**](https://www.freepik.com/ai) <br> <sub><code>freepik.com/ai</code></sub> | Piksel tabanlı görseller için AI destekli grafik düzenleme |

</details>

<details>
<summary><b>🎥 Video</b> <code>16 servis</code></summary>

| # | Servis | Açıklama |
|---|--------|----------|
| 1 | [**Runway**](https://runwayml.com) <br> <sub><code>runwayml.com</code></sub> | Profesyonel video düzenleme ve üretim için AI platformu |
| 2 | [**Pika**](https://pika.art) <br> <sub><code>pika.art</code></sub> | Metin ve görselden hızlı AI video oluşturma |
| 3 | [**Kling AI**](https://klingai.com) <br> <sub><code>klingai.com</code></sub> | Kuaishou'nun gerçekçi video üretim modeli |
| 4 | [**Hailuo AI**](https://hailuoai.video) <br> <sub><code>hailuoai.video</code></sub> | MiniMax'in metinden etkileyici video üretim aracı |
| 5 | [**Luma AI**](https://lumalabs.ai) <br> <sub><code>lumalabs.ai</code></sub> | Gerçekçi 3D tarama ve video oluşturma platformu |
| 6 | [**HeyGen**](https://www.heygen.com) <br> <sub><code>heygen.com</code></sub> | Yapay zeka avatarları ile profesyonel video üretim platformu |
| 7 | [**Synthesia**](https://www.synthesia.io) <br> <sub><code>synthesia.io</code></sub> | AI avatarlarla kurumsal video üretim platformu |
| 8 | [**InVideo AI**](https://invideo.io/ai) <br> <sub><code>invideo.io/ai</code></sub> | Şablonlarla hızlı AI video oluşturma |
| 9 | [**VEED AI**](https://www.veed.io/tools/ai) <br> <sub><code>veed.io/tools/ai</code></sub> | Web tabanlı AI video düzenleme ve altyazı ekleme aracı |
| 10 | [**Kapwing AI**](https://www.kapwing.com/ai) <br> <sub><code>kapwing.com/ai</code></sub> | Ekip bazlı AI video düzenleme ve işbirliği platformu |
| 11 | [**OpusClip**](https://www.opus.pro) <br> <sub><code>opus.pro</code></sub> | Uzun videoları kısa pazarlama kliplerine dönüştürme |
| 12 | [**Captions**](https://www.captions.ai) <br> <sub><code>captions.ai</code></sub> | AI destekli otomatik altyazı ve video düzenleme |
| 13 | [**D-ID**](https://www.d-id.com) <br> <sub><code>d-id.com</code></sub> | Canlı konuşan yapay zeka avatarları oluşturma |
| 14 | [**Colossyan**](https://www.colossyan.com) <br> <sub><code>colossyan.com</code></sub> | İş eğitimi için AI sunucu sunumları ve video oluşturma |
| 15 | [**Fliki**](https://fliki.ai) <br> <sub><code>fliki.ai</code></sub> | Metinden kısa video oluşturmada uzmanlaşmış platform |
| 16 | [**Kaiber**](https://kaiber.ai) <br> <sub><code>kaiber.ai</code></sub> | Sanatsal ve soyut AI video dönüşümleri |

</details>

<details>
<summary><b>🎵 Ses / Audio</b> <code>14 servis</code></summary>

| # | Servis | Açıklama |
|---|--------|----------|
| 1 | [**ElevenLabs**](https://elevenlabs.io) <br> <sub><code>elevenlabs.io</code></sub> | Gerçekçi AI ses sentezi ve ses klonlama |
| 2 | [**Suno**](https://suno.com) <br> <sub><code>suno.com</code></sub> | Metinden müzik ve şarkı üreten AI platformu |
| 3 | [**Udio**](https://udio.com) <br> <sub><code>udio.com</code></sub> | Metin girdisiyle yüksek kaliteli müzik üretimi |
| 4 | [**Descript**](https://www.descript.com) <br> <sub><code>descript.com</code></sub> | AI destekli ses ve video düzenleme platformu |
| 5 | [**Krisp**](https://krisp.ai) <br> <sub><code>krisp.ai</code></sub> | Yapay zeka ile gürültü engelleme ve toplantı asistanı |
| 6 | [**Adobe Podcast**](https://podcast.adobe.com) <br> <sub><code>podcast.adobe.com</code></sub> | Adobe'nin AI destekli podcast kayıt ve düzenleme aracı |
| 7 | [**Murf AI**](https://murf.ai) <br> <sub><code>murf.ai</code></sub> | Yapay zeka ile profesyonel seslendirme oluşturma |
| 8 | [**Speechify**](https://speechify.com) <br> <sub><code>speechify.com</code></sub> | Metni doğal sese dönüştüren sesli okuma platformu |
| 9 | [**LOVO AI**](https://lovo.ai) <br> <sub><code>lovo.ai</code></sub> | Doğal seslendirme ve duygu yüklü ses sentezi |
| 10 | [**Resemble AI**](https://www.resemble.ai) <br> <sub><code>resemble.ai</code></sub> | Özel ses klonlama ve deepfake ses üretimi |
| 11 | [**AIVA**](https://www.aiva.ai) <br> <sub><code>aiva.ai</code></sub> | Klasik müzik ve film müzikleri için AI besteci |
| 12 | [**Soundraw**](https://soundraw.io) <br> <sub><code>soundraw.io</code></sub> | AI destekli telifsiz müzik oluşturma ve düzenleme |
| 13 | [**Boomy**](https://boomy.com) <br> <sub><code>boomy.com</code></sub> | Yapay zeka ile anında müzik oluşturma platformu |
| 14 | [**Beatoven.ai**](https://www.beatoven.ai) <br> <sub><code>beatoven.ai</code></sub> | AI ile ruh hali tabanlı telifsiz müzik besteleme |

</details>

<details>
<summary><b>💻 Kod / Code</b> <code>17 servis</code></summary>

| # | Servis | Açıklama |
|---|--------|----------|
| 1 | [**Bolt.new**](https://bolt.new) <br> <sub><code>bolt.new</code></sub> | Yapay zeka ile hızlı full-stack uygulama geliştirme |
| 2 | [**Lovable**](https://lovable.dev) <br> <sub><code>lovable.dev</code></sub> | Doğal dil ile uygulama oluşturan AI platformu |
| 3 | [**Replit**](https://replit.com) <br> <sub><code>replit.com</code></sub> | Tarayıcı tabanlı AI kod geliştirme ortamı |
| 4 | [**Cursor**](https://cursor.com) <br> <sub><code>cursor.com</code></sub> | Yapay zeka entegre kod düzenleyici |
| 5 | [**Windsurf**](https://windsurf.com) <br> <sub><code>windsurf.com</code></sub> | Cascade ile yapay zeka destekli IDE |
| 6 | [**Codeium**](https://codeium.com) <br> <sub><code>codeium.com</code></sub> | Hızlı ve ücretsiz AI kod tamamlama ve sohbet |
| 7 | [**Tabnine**](https://www.tabnine.com) <br> <sub><code>tabnine.com</code></sub> | Özel kod tabanınıza göre eğitilen AI kod tamamlama |
| 8 | [**Devin**](https://devin.ai) <br> <sub><code>devin.ai</code></sub> | Otonom yazılım geliştirme için AI yazılım mühendisi |
| 9 | [**OpenHands**](https://openhands.dev) <br> <sub><code>openhands.dev</code></sub> | AI geliştirme aracıları için açık kaynak platform |
| 10 | [**Manus AI**](https://manus.im) <br> <sub><code>manus.im</code></sub> | Bağımsız görevleri yürütebilen genel amaçlı AI aracı |
| 11 | [**GitHub Copilot**](https://github.com/features/copilot) <br> <sub><code>github.com/features/copilot</code></sub> | Gerçek zamanlı kod tamamlama ve öneri asistanı |
| 12 | [**Amazon Q Developer**](https://aws.amazon.com/q/developer) <br> <sub><code>aws.amazon.com/q/developer</code></sub> | AWS hizmetleri için kod oluşturma ve sorun giderme |
| 13 | [**JetBrains AI Assistant**](https://www.jetbrains.com/ai) <br> <sub><code>jetbrains.com/ai</code></sub> | JetBrains IDE'leri için entegre AI kod yardımı |
| 14 | [**Figma AI**](https://www.figma.com/ai) <br> <sub><code>figma.com/ai</code></sub> | Figma'da yapay zeka destekli tasarım üretimi |

</details>

<details>
<summary><b>📚 Üretkenlik / Productivity</b> <code>8 servis</code></summary>

| # | Servis | Açıklama |
|---|--------|----------|
| 1 | [**Gamma**](https://gamma.app) <br> <sub><code>gamma.app</code></sub> | AI ile sunum ve doküman oluşturma aracı |
| 2 | [**Napkin AI**](https://napkin.ai) <br> <sub><code>napkin.ai</code></sub> | Metni görsel hikayelere dönüştüren yapay zeka aracı |
| 3 | [**Mem.ai**](https://mem.ai) <br> <sub><code>mem.ai</code></sub> | AI destekli kişisel bilgi yönetimi ve not alma platformu |
| 4 | [**Notion AI**](https://www.notion.so/product/ai) <br> <sub><code>notion.so/product/ai</code></sub> | Not alma ve bilgi yönetimine entegre AI asistanı |
| 5 | [**Canva Magic Studio**](https://www.canva.com/magic-studio) <br> <sub><code>canva.com/magic-studio</code></sub> | Canva içinde AI destekli tasarım araçları |
| 6 | [**Otter.ai**](https://otter.ai) <br> <sub><code>otter.ai</code></sub> | Gerçek zamanlı toplantı transkripsiyonu ve not alma |
| 7 | [**Fireflies.ai**](https://fireflies.ai) <br> <sub><code>fireflies.ai</code></sub> | Toplantı notları ve transkripsiyon için AI asistanı |

</details>

<details>
<summary><b>🔬 Araştırma / Research</b> <code>6 servis</code></summary>

| # | Servis | Açıklama |
|---|--------|----------|
| 1 | [**ResearchRabbit**](https://www.researchrabbit.ai) <br> <sub><code>researchrabbit.ai</code></sub> | Akademik makaleler için keşif ve takip platformu |
| 2 | [**Connected Papers**](https://www.connectedpapers.com) <br> <sub><code>connectedpapers.com</code></sub> | Akademik makaleler arası görsel bağlantı keşfi |
| 3 | [**Elicit**](https://elicit.com) <br> <sub><code>elicit.com</code></sub> | Akademik araştırmalar için AI destekli literatür taraması |
| 4 | [**Consensus**](https://consensus.app) <br> <sub><code>consensus.app</code></sub> | Bilimsel makalelerden kanıta dayalı yanıtlar arama |
| 5 | [**Scite**](https://scite.ai) <br> <sub><code>scite.ai</code></sub> | Alıntı bağlamı gösteren akıllı alıntı analizi |
| 6 | [**SciSpace**](https://scispace.com) <br> <sub><code>scispace.com</code></sub> | Araştırma makalelerini anlama ve açıklama asistanı |

</details>

<br />

## ⌨️ Klavye Kısayolları / Keyboard Shortcuts

| Kısayol | Eylem | Action |
|----------|-------|--------|
| `Alt+Space` | Uygulamayı aç/kapat | Toggle app (configurable) |
| `Ctrl+R` | Servisi yenile | Reload service |
| `Ctrl+Shift+R` | Önbelleksiz yenile | Reload ignoring cache |
| `Ctrl+=` / `Ctrl++` | Yakınlaştır | Zoom in |
| `Ctrl+-` | Uzaklaştır | Zoom out |
| `Ctrl+0` | Yakınlaştırmayı sıfırla | Reset zoom |
| `F11` | Tam ekran | Toggle fullscreen |
| `Alt+Left` | Geri | Go back |
| `Alt+Right` | İleri | Go forward |
| `Ctrl+Shift+I` | Geliştirici araçları | DevTools (dev only) |
| `Ctrl+Q` | Çıkış | Quit |

<br />

## 🛠️ Gereksinimler / Requirements

- **Node.js** 18+
- **npm** 9+

<br />

## 🌍 Yeni Dil Ekleme / Adding a New Language

1. `src/renderer/translations.ts` — Her anahtara dil girdisi ekleyin
2. `src/renderer/index.html` — `<select id="language-select">`'e seçenek ekleyin
3. `src/main/settings-store.ts` — `AppSettings.language` tipine dil kodunu ekleyin
4. `src/main/service-view.ts` — `currentLanguage` tipini güncelleyin

<br />

## 🧱 Tech Stack

<div align="center">

| | |
|---|---|
| **Runtime** | [Electron 43](https://www.electronjs.org/) |
| **Language** | [TypeScript 7](https://www.typescriptlang.org/) |
| **Renderer** | [Vite 8](https://vitejs.dev/) |
| **Main Build** | [tsup](https://tsup.egoist.dev/) |
| **Packaging** | [electron-builder](https://www.electron.build/) |
| **Icons** | [sharp](https://sharp.pixelplumbing.com/) |

</div>

<br />

## 📄 License

MIT © 2026 — AI Hub

---

<p align="center">
  <sub>Built with ❤️ for the AI community</sub>
</p>
