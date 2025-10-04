// scripts/setup.js
// botyum-basics kurulum yardımcısı
// - Kalıcı çalışma klasörlerini oluşturur (~/.botyum)
// - Gerekli alt klasörleri açar (tmp, cache, exports, events, voice-notes, camera)
// - Proje kökünde documents/ klasörünü oluşturur
// - ~/.botyum/botyum.json dosyasını ilk değerlerle üretir (yoksa)
// - .env yoksa, .env.example mevcutsa; --copy-env argümanı veya AUTO_COPY_ENV=1 ile .env kopyalayabilir
// - Dış araçlar için sağlık kontrolü (ffmpeg, tesseract, pdftoppm, soffice, yt-dlp, telegram-cli, unzip, xclip/xsel, espeak/spd-say)
// Not: Script etkileşimsizdir; eksik araçlarda kırılmaz, sadece uyarı basar.

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { exec as _exec } from 'child_process';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const exec = promisify(_exec);

// __dirname eşleniği (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const LOG = {
  info:  (m) => console.log(`[setup] ${m}`),
  ok:    (m) => console.log(`\x1b[32m[ok]\x1b[0m ${m}`),
  warn:  (m) => console.log(`\x1b[33m[warn]\x1b[0m ${m}`),
  error: (m) => console.log(`\x1b[31m[err]\x1b[0m ${m}`)
};

function isWindows() { return process.platform === 'win32'; }
function isMac()     { return process.platform === 'darwin'; }

async function hasCmd(cmd) {
  try {
    const bin = isWindows() ? 'where' : 'which';
    await exec(`${bin} ${cmd}`);
    return true;
  } catch { return false; }
}

async function ensureDirs() {
  const HOME = os.homedir();
  const BASE = path.join(HOME, '.botyum');
  const DIRS = [
    BASE,
    path.join(BASE, 'tmp'),
    path.join(BASE, 'cache'),
    path.join(BASE, 'exports'),
    path.join(BASE, 'events'),
    path.join(BASE, 'voice-notes'),
    path.join(BASE, 'camera'),
  ];
  for (const d of DIRS) await fs.ensureDir(d);

  const DOCS = path.join(process.cwd(), 'documents');
  await fs.ensureDir(DOCS);
  // boş dizinlerin git’te korunması için .keep oluşturulabilir
  const keepFiles = [
    path.join(DOCS, '.keep'),
    path.join(BASE, 'tmp', '.keep'),
    path.join(BASE, 'cache', '.keep'),
    path.join(BASE, 'exports', '.keep'),
    path.join(BASE, 'events', '.keep'),
    path.join(BASE, 'voice-notes', '.keep'),
    path.join(BASE, 'camera', '.keep'),
  ];
  for (const k of keepFiles) {
    try { await fs.ensureFile(k); } catch {}
  }

  LOG.ok(`Klasörler hazırlandı:
  - ${BASE}
  - ${DOCS}`);
}

async function ensureStore() {
  const HOME = os.homedir();
  const STORE_FILE = path.join(HOME, '.botyum', 'botyum.json');

  if (await fs.pathExists(STORE_FILE)) {
    LOG.info(`Kalıcı veritabanı mevcut: ${STORE_FILE}`);
    return;
  }

  const initial = {
    notes: [],
    todos: [],
    alarms: [],
    settings: {
      libretranslate_url: process.env.LIBRETRANSLATE_URL || 'https://libretranslate.de',
      tts_enabled: true
    },
    // isteğe bağlı alanlar (bazı modüller kullanır)
    email: {},                 // IMAP ayarları
    expenses: [],              // harcama kayıtları
    templates: {},             // mesaj şablonları
    synonyms: {},              // eş anlamlı sözlük
    profile: {},               // kullanıcı profili
    slack: { token: process.env.SLACK_TOKEN || '' },
    events: []                 // takvim CRUD
  };

  await fs.writeJson(STORE_FILE, initial, { spaces: 2 });
  LOG.ok(`Kalıcı veritabanı oluşturuldu: ${STORE_FILE}`);
}

async function maybeCopyEnv() {
  const root = path.resolve(__dirname, '..'); // project root (scripts/..)
  const envFile = path.join(root, '.env');
  const envEx   = path.join(root, '.env.example');

  const shouldCopy = process.argv.includes('--copy-env') || process.env.AUTO_COPY_ENV === '1';

  if (!(await fs.pathExists(envEx))) {
    LOG.warn('.env.example bulunamadı (opsiyonel).');
    return;
  }
  if (await fs.pathExists(envFile)) {
    LOG.info('.env mevcut, kopyalama atlandı.');
    return;
  }
  if (shouldCopy) {
    await fs.copy(envEx, envFile, { overwrite: false, errorOnExist: false });
    LOG.ok('.env.example -> .env kopyalandı.');
  } else {
    LOG.info('.env bulunamadı. İsterseniz: `npm run setup -- --copy-env` veya `AUTO_COPY_ENV=1 npm run setup` ile otomatik kopyalayabilirsiniz.');
  }
}

async function healthCheck() {
  LOG.info('Dış araçlar sağlık kontrolü (opsiyonel ama önerilir):');

  const tools = [
    // ses/kamera
    'ffmpeg',
    // OCR
    'tesseract', 'pdftoppm',
    // office dönüştürme
    'soffice',
    // video/site araçları
    'yt-dlp',
    // telegram CLI
    'telegram-cli',
    // arşiv/dosya
    'unzip',
    // pano ve TTS (linux)
    'xclip', 'xsel', 'espeak', 'spd-say'
  ];

  const found = [];
  const missing = [];
  for (const t of tools) {
    // tek tek kontrol, platforma uygun alternatifleri de değerlendirebiliriz
    const ok = await hasCmd(t);
    (ok ? found : missing).push(t);
  }

  if (found.length)  LOG.ok(`Bulunanlar: ${found.join(', ')}`);
  if (missing.length) LOG.warn(`Bulunamayanlar: ${missing.join(', ')}`);

  // platform özel hatırlatmalar
  if (isMac()) {
    LOG.info('macOS notu: `say` ve `screencapture` sistemle gelir. Mikrofon/kamera erişim izinlerini Sistem Ayarları’ndan verin.');
  } else if (isWindows()) {
    LOG.info('Windows notu: TTS için PowerShell SAPI kullanılır. Kamera/Mikrofon için ffmpeg’in uygun cihaz adlarına erişimi gerekir (dshow).');
  } else {
    LOG.info('Linux notu: Pano için xclip/xsel, TTS için espeak/spd-say, ekran görüntüsü için gnome-screenshot veya ImageMagick `import` faydalıdır.');
  }
}

async function main() {
  try {
    LOG.info('Kurulum başlatıldı...');
    await ensureDirs();
    await ensureStore();
    await maybeCopyEnv();
    await healthCheck();
    LOG.ok('Kurulum tamam ✅ Artık `npm run dev` ile çalıştırabilirsin.');
  } catch (e) {
    LOG.error(`Kurulum hatası: ${e.message}`);
    process.exit(1);
  }
}

main();
