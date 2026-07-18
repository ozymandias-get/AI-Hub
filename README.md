# ChatGPT Desktop

ChatGPT web arayüzünü güvenli bir Electron kabuğunda çalıştıran Windows masaüstü uygulaması.

## Özellikler

- ChatGPT web sitesini `WebContentsView` ile gösterir
- Pencere boyutu/konumu ve zoom kalıcılığı
- Klavye kısayolları (Ctrl+R, Ctrl+L, F11, vb.)
- Türkçe uygulama menüsü
- Dosya indirme + Windows bildirimi
- Bağlantı hatası ekranı + yükleme çubuğu (IPC ile retry)
- Sistem tepsisi desteği (menüden aç/kapa)
- Güvenlik: sandbox, contextIsolation, nodeIntegration kapalı
- Tek örnek kilidi (ikinci açılışı engeller)
- OAuth domain desteği (Google, Apple, Microsoft, GitHub)

## Gereksinimler

- Node.js 18+
- npm 9+

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm run dev
```

Uygulamayı development modunda başlatır. Geliştirici araçlarına `Ctrl+Shift+I` ile erişilebilir.

## Build

```bash
npm run build
```

## Paketleme

Windows kurulum dosyası oluşturmak için:

```bash
npm run dist
```

Portable `.exe` oluşturmak için:

```bash
npm run dist:portable
```

Çıktılar `release/` klasörüne yazılır.

## Proje Yapısı

```
src/
├─ main/           # Electron main process
│  ├─ main.ts            # Entry point, tek örnek kilidi
│  ├─ window-manager.ts  # Pencere oluşturma ve kalıcılık
│  ├─ chatgpt-view.ts    # WebContentsView yönetimi
│  ├─ navigation-policy.ts # Gezinme kuralları
│  ├─ permissions.ts     # İzin yönetimi
│  ├─ downloads.ts       # Dosya indirme
│  ├─ menu.ts            # Uygulama menüsü
│  ├─ shortcuts.ts       # Klavye kısayolları
│  ├─ settings-store.ts  # Ayarlar kalıcılığı
│  ├─ ipc.ts             # Renderer IPC
│  ├─ app-state.ts       # Çıkış bayrağı
│  └─ tray.ts            # Sistem tepsisi
├─ preload/
│  └─ preload.ts         # Shell renderer bridge (contextBridge)
└─ renderer/
   ├─ index.html         # Hata ekranı
   ├─ renderer.ts        # Retry / tarayıcıda aç
   └─ styles.css         # Stiller
```

## Kısayollar

| Kısayol | İşlem |
|---------|-------|
| Ctrl+R | Sayfayı yenile |
| Ctrl+Shift+R | Önbelleği yok sayarak yenile |
| Ctrl+L | ChatGPT ana sayfasına git |
| Ctrl+= / Ctrl++ | Yakınlaştır |
| Ctrl+- | Uzaklaştır |
| Ctrl+0 | Yakınlaştırmayı sıfırla |
| F11 | Tam ekran |
| Alt+Left | Geri git |
| Alt+Right | İleri git |
| Ctrl+Shift+I | Geliştirici araçları (dev) |
| Ctrl+Q | Çıkış |

## Paket Bilgisi

- Uygulama adı: `ChatGPT Desktop`
- Paket kimliği: `com.local.chatgptdesktop`
- Platform: Windows (x64)
