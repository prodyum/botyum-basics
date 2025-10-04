# botyum-basics

**botyum-basics**, Siri / Google Assistant / Alexa ruhunu **Node.js 18+** üzerinde çalışan bir **konsol asistanına** taşıyan modüler bir uygulamadır.  
Tüm özellikler *features1…features6* modüllerine ayrılmıştır; `index.js` sadece **kayıt (registration)**, **menü yönetimi** ve **alarm planlama** yapar.

> **Hızlı bakış:**  
> - Çekirdek: tarih/saat, gelişmiş hesap makinesi, web sayfası çekme, arama, link üretimi, Wikipedia Q&A, birim dönüşüm, zamanlayıcı & alarm, notlar/ToDo, çeviri, hava durumu, TTS, ayarlar.  
> - Genişletmeler: ICS/IMAP/RSS/fiyat-kripto, özetleme/PDF→TTS, doğal hatırlatıcı, harcama, pano, şablonlar, medya & konfor.  
> - Sosyal/medya/araçlar: “bugünüm”, harita/paket takip, TZ çevirici, CSV istatistik, sistem bilgisi, sözlükler, YouTube/medya arama, sosyal arama, alıntı/şiir.  
> - Yardımcılar: Webhook/ICS oluşturucu/alışveriş listesi/SRS kartlar/Pomodoro/QR/Güneş-Ay/şifre/URL kısaltma/dosya bulucu/bahşiş & bölüş/okunabilirlik.  
> - Eğlence & finans: zar/yazı-tura/taş-kağıt-makas, rastgele sayı, sözlükler, kronometre, podcast & YouTube arama, spor sonuçları, Apple/Amazon Music arama, para ve **döviz** (disk cache’li).  
> - İleri: **STT** (yerel & Chrome), uyandırma sözcüğü, ekran görüntüsü + **OCR**, profil, sesli not, kamera video/foto, sayfa izleme, trafik linkleri, **Telegram**, ses dosyası transkript, takvim CRUD + hatırlatıcı, **Office belge üretimi** (LibreOffice), hızlı metin, documents gezgin & arama & OCR, **Issues** (GitHub/Jira/Trello/Azure), **Quora**, **Reddit**, **Slack**.

---

## Gereksinimler

- **Node.js 18+**
- **NPM** (Node ile gelir)
- Aşağıdaki **npm paketleri** `package.json` ile otomatik kurulur:
  - `chalk`, `cli-table3`, `countries-and-timezones`, `country-list`, `fast-xml-parser`,  
    `fs-extra`, `html-to-text`, `imapflow`, `inquirer`, `luxon`, `mathjs`,  
    `node-ical`, `open`, `pdf-parse`
- **Dış araçlar** *(opsiyonel ama bazı özellikler için gerekli)*:
  - **ffmpeg** (mikrofon/kamera, ses-video kayıt)  
  - **tesseract** (OCR), **pdftoppm** (PDF→resim)  
  - **soffice** (LibreOffice; docx/xlsx/pptx üretimi)  
  - **yt-dlp** (YouTube bölüm/medya bilgisi)  
  - **telegram-cli** (Telegram sohbet liste/okuma)  
  - **unzip** (DOCX düz metin çıkarımı)  
  - Linux için: `xclip`/`xsel`, `espeak`/`spd-say`; macOS: `say`, `screencapture`; Windows: PowerShell SAPI

> Dış araçlar kurulu değilse ilgili özellikler nazikçe uyarır; uygulama çalışmaya devam eder.

---

## Kurulum

```bash
git clone <repo-url> botyum-basics
cd botyum-basics
npm install
npm run setup
npm run dev
````

* `npm run setup`:

  * `~/.botyum/` (kalıcı çalışma alanı) ve alt klasörlerini (`tmp`, `cache`, `exports`, `events`, `voice-notes`, `camera`) oluşturur
  * Proje kökünde `documents/` klasörünü hazırlar
  * `~/.botyum/botyum.json` dosyasını örnek içerikle oluşturur (yoksa)
  * **Sağlık kontrolü**: ffmpeg, tesseract, vs. araçlar için hızlı kontrol çıktısı verir
  * İsteğe bağlı `.env` kopyalama:
    `npm run setup -- --copy-env` **veya** `AUTO_COPY_ENV=1 npm run setup`

---

## Ortam Değişkenleri

`.env.example` dosyasını `.env` olarak düzenleyebilirsiniz.

| Değişken                                                       | Açıklama                                                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `LIBRETRANSLATE_URL`                                           | Çeviri servisi uç noktası (varsayılan `https://libretranslate.de`)                                  |
| `SLACK_TOKEN`                                                  | Slack Bot/User OAuth Token (features6 → Slack)                                                      |
| `GITHUB_TOKEN`                                                 | GitHub Issues aramalarında rate-limit’i rahatlatır                                                  |
| `TRELLO_KEY`, `TRELLO_TOKEN`                                   | Trello API kullanımı (features6 → Issues)                                                           |
| `IMAP_HOST`, `IMAP_USER`, `IMAP_PASS`, `IMAP_PORT`, `IMAP_TLS` | IMAP e-posta özeti (features2) için opsiyonel değişkenler (modül içinden interaktif de girilebilir) |

> Çoğu modül **anahtar gerektirmeyen** açık API’ları tercih eder (Open-Meteo/Geocoding, dictionaryapi.dev, Quotable, TinyURL, iTunes arama…).

---

## Çalıştırma

```bash
npm run dev
```

Açılan **ana menü**, modülleri bloklar hâlinde sunar:

* **Çekirdek (features1)** → tarih/saat, hesap makinesi, tarayıcıda aç, curl ile sayfa çek, Google/DDG arama, tel/sms/WhatsApp linkleri, Wikipedia Q&A, birim dönüşüm, zamanlayıcı & alarm, notlar/ToDo, çeviri, hava durumu, TTS, ayarlar.
* **Modül 2 (features2)** → ICS takvim görüntüleme, IMAP e-posta özeti, RSS başlıkları, döviz & kripto kısa fiyat, metin özetleme, PDF→TTS, doğal dil hatırlatıcı (basit), harcama takip, pano araçları, şablon mesajlar, medya aç + hatırlat, konfor kısayolları.
* **Modül 3 (features3)** → “Bugünüm”, harita linki, kargo/paket takip linki, zaman dilimi çevirici, CSV istatistik, sistem bilgisi, EN/TR sözlük, YouTube arama, sosyal arama (FB/IG/Twitter/LinkedIn), alıntı/şiir.
* **Modül 4 (features4)** → Webhook tetikleyici (IFTTT/HA/n8n), ICS etkinlik oluşturma, alışveriş listesi, ezber kartları (Leitner), Pomodoro, QR kod üretimi, Gündoğumu/Günbatımı + Ay evresi, şifre/passphrase üretici, URL kısaltma, dosya bulucu, bahşiş & bölüşme, okunabilirlik (ARI).
* **Modül 5 (features5)** → Zar/yazı-tura/taş-kağıt-makas, rastgele sayı, EN→EN sözlük, çok dilli sözlük (çeviri), kronometre, podcast arama, YouTube arama, spor sonuçları hızlı özet, Apple/Amazon Music arama, para işlemleri (yüzde/KDV), **döviz** (exchangerate.host, 60 sn disk cache).
* **Modül 6 (features6)** → **Speech-to-Clipboard** (yerel STT/Chrome Web Speech), **uyandırma sözcüğü**, eş anlamlı sözlük, ekran görüntüsü + **OCR**, kullanıcı profili, sesli not, kamera video/fotoğraf, web bölüm izleme (regex), trafik linkleri, **Telegram** yardımcıları, ses dosyasından transkript, **takvim CRUD + hatırlatıcı**, **Office belge üretimi** (LibreOffice), hızlı metin, `documents/` gez & ara & OCR, **Issues** (GitHub/Jira/Trello/Azure), **Quora**, **Reddit**, **Slack**.

> **Alarm/hatırlatıcı** kayıtları `~/.botyum/botyum.json` dosyasında tutulur. `index.js` periyodik olarak bu kayıtları tarar ve zamanı gelince terminal uyarısı + TTS yapar.

---

## Dosya Yapısı

```
.
├─ index.js                # Modül kayıt + menü + alarm planlayıcı
├─ features1.js            # Çekirdek
├─ features2.js            # Takvim/IMAP/RSS/Fiyat/Özet/PDF→TTS/...
├─ features3.js            # Bugünüm/Harita/Sosyal/Medya/...
├─ features4.js            # Webhook/ICS/QR/Pomodoro/...
├─ features5.js            # Oyun/Sözlük/Podcast/Döviz/...
├─ features6.js            # STT/OCR/Kamera/Issues/Slack/...
├─ scripts/
│  └─ setup.js             # İlk kurulum yardımcısı
├─ documents/              # Kullanıcı belgeleri (tarama/arama/ocr burada)
├─ cache/                  # (Çalışma zamanında oluşturulabilir)
├─ .env.example            # Örnek çevre değişkenleri
└─ package.json
```

---

## İpuçları

* **Chrome Web Speech (STT):** features6 → “Speech-to-Clipboard” menüsünde küçük bir HTML yardımcı sayfası açılır. Tarayıcı mikrofon iznini verin; konuşma otomatik panoya kopyalanır.
* **Yerel STT:** `whisper.cpp` veya `vosk` yüklüyse ses dosyalarını metne çevirebilir. Mikrofon için `ffmpeg` gereklidir.
* **OCR:** `tesseract` (TR+EN dil paketleri) yüklüyse ekran görüntüsü/ PDF/ resimden metin çıkarma çalışır.
* **Office belge üretimi:** `soffice` (LibreOffice) varsa docx/xlsx/pptx üretir; yoksa HTML/CSV yedek dosya oluşturur.
* **Telegram:** link üretimi için tarayıcı yeterlidir; sohbet liste/okuma için `telegram-cli` gerekir.
* **Döviz:** kur verileri `cache/fx-*.json` altına yazılır, **60 sn** cache süresi vardır.

---

## Güvenlik / Gizlilik

* Tüm kalıcı verileriniz **yerel** `~/.botyum/` altındadır: notlar, ToDo’lar, şablonlar, profil bilgisi, alarm kayıtları.
* API istekleri doğrudan hedef servislere gider. Gizli anahtarlar `.env` / `~/.botyum/botyum.json` içinde tutulur; **repo’ya eklemeyin**.

---

## Sorun Giderme

* `node: command not found` → Node.js 18+ kurulu olmalı.
* `Error: curl hatası` → sistemde `curl` bulunmalı (Windows’ta yeni sürümlerde var).
* STT/ffmpeg “device not found” → Windows’ta dshow cihaz adı (`Integrated Camera`, `virtual-audio-capturer`) değişken olabilir; ffmpeg komutunu güncelleyin.
* OCR sonuçları boş → `tesseract` ve TR/EN dil paketleri kurulu mu? `pdftoppm` var mı?

---

## Geliştirme

* Yeni bir modül eklemek için `featuresX.js` içinde `registerFeaturesX(ctx)` yaz; `index.js`’te import edip `const featuresX = registerFeaturesX(ctxBase)` ile kaydet; menüye ekle.
* `ctx` standart alanlar: `inquirer, curl, ok, err, warn, dim, title, printDivider, readStore, writeStore, ttsSay, isWindows, isMac, open, DateTime, Interval, Duration, ct, getCountryCode, math, htmlToText, Table` (modüle göre genişleyebilir).

---

## Komutlar

```bash
npm run setup        # ilk kurulum (klasörler, json, sağlık kontrolü)
npm run dev          # uygulamayı başlat
npm start            # dev ile aynı
```

---

## Sürümleme & Lisans

* **Sürüm:** 1.0.0 (modüler tam paket; features1–6 kapsar)
* **Lisans:** MIT