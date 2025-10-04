// features2.js
// Takvim, e-posta özeti, RSS, fiyat / kripto, metin özetleme, PDF → TTS, doğal hatırlatıcı,
// harcama takip, pano araçları, şablon mesaj, medya aç + hatırlat, konfor kısayolları.

import fs from "fs-extra";
import path from "path";
import os from "os";
import { DateTime } from "luxon";
import { htmlToText } from "html-to-text";

export function registerFeatures2(ctx) {
  const {
    inquirer,
    ok,
    err,
    warn,
    dim,
    title,
    printDivider,
    readStore,
    writeStore,
    curl,
    ttsSay,
    scheduleCountdown,
    scheduleAbsolute,
    STORE_FILE
  } = ctx;

  const CACHE_DIR = path.join(os.homedir(), ".botyum", "cache");
  fs.ensureDirSync(CACHE_DIR);

  // 1) Takvim (ICS) görüntü / import / göster
  async function calendarMenu() {
    const { pathUrl } = await inquirer.prompt([{ type: "input", name: "pathUrl", message: "ICS URL veya dosya yolu:" }]);
    try {
      let data;
      if (pathUrl.startsWith("http")) {
        data = await curl(pathUrl, { Accept: "application/octet-stream" }, 20);
      } else {
        data = await fs.readFile(pathUrl, "utf8");
      }
      // Basit parse: satır satır al, DTSTART/DTEND/SUMMARY çıkar
      const lines = data.split(/\r?\n/);
      const events = [];
      let e = {};
      for (const l of lines) {
        if (l.startsWith("BEGIN:VEVENT")) e = {};
        else if (l.startsWith("END:VEVENT")) events.push(e);
        else if (l.startsWith("DTSTART")) e.start = l.split(":")[1];
        else if (l.startsWith("DTEND")) e.end = l.split(":")[1];
        else if (l.startsWith("SUMMARY")) e.summary = l.split(":")[1];
      }
      console.log(title("Takvim Etkinlikleri:"));
      events.forEach((ev, i) => {
        console.log(`${ok(i + 1)}) ${ev.summary} | ${ev.start} → ${ev.end}`);
      });
      printDivider();
    } catch (e) {
      console.log(err("Takvim alınamadı: " + e.message));
    }
  }

  // 2) E-posta özeti (IMAP)
  async function emailDigestMenu() {
    const s = await readStore();
    s.email ||= {};
    const { op } = await inquirer.prompt([{ type: "list", name: "op", message: "E-posta Özeti:", choices: ["Ayarla", "Özet al", "Geri"] }]);
    if (op === "Geri") return;
    if (op === "Ayarla") {
      const a = await inquirer.prompt([
        { type: "input", name: "host", message: "IMAP sunucu:" },
        { type: "number", name: "port", message: "Port:", default: 993 },
        { type: "confirm", name: "tls", message: "TLS kullan?", default: true },
        { type: "input", name: "user", message: "Kullanıcı e-posta:" },
        { type: "input", name: "pass", message: "Parola / uygulama şifresi:" }
      ]);
      s.email = a;
      await writeStore(s);
      console.log(ok("Kaydedildi."));
      return;
    }
    if (!s.email.host) {
      console.log(err("E-posta ayarları eksik."));
      return;
    }
    try {
      // Basit: IMAP bağlantı kur, Inbox’dan en son 5 konu al
      const { Inbox } = await import("imapflow");
      const client = new Inbox({
        host: s.email.host,
        port: s.email.port,
        secure: s.email.tls,
        auth: { user: s.email.user, pass: s.email.pass }
      });
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");
      try {
        const messages = await client.listMessages("INBOX", "1:*", { uid: true, subject: true, from: true, date: true });
        const last = messages.slice(-5);
        console.log(title("E-posta Özeti (son 5):"));
        last.forEach(m => {
          console.log(`${ok(m.date)} | ${m.from} | ${m.subject}`);
        });
        printDivider();
      } finally {
        lock.release();
      }
      await client.logout();
    } catch (e) {
      console.log(err("E-posta okunamadı: " + e.message));
    }
  }

  // 3) RSS Haber başlıkları
  async function newsMenu() {
    const { url } = await inquirer.prompt([{ type: "input", name: "url", message: "RSS URL:" }]);
    try {
      const xml = await curl(url, { Accept: "application/xml" }, 15);
      const { XMLParser } = await import("fast-xml-parser");
      const parser = new XMLParser();
      const j = parser.parse(xml);
      const items = j.rss?.channel?.item || [];
      console.log(title("Haber Başlıkları:"));
      items.slice(0, 10).forEach((it, i) => {
        console.log(`${ok(i + 1)}) ${it.title}`);
      });
      printDivider();
    } catch (e) {
      console.log(err("RSS hatası: " + e.message));
    }
  }

  // 4) Fiyat / Kripto işlemleri (exchangerate.host, coingecko)
  async function pricesMenu() {
    const { type } = await inquirer.prompt([{ type: "list", name: "type", message: "Tür:", choices: ["Döviz", "Kripto"] }]);
    const { base, target } = await inquirer.prompt([
      { type: "input", name: "base", message: "Baz birim (USD, EUR, BTC...):", default: "USD" },
      { type: "input", name: "target", message: "Hedef birim (TRY, EUR, ETH...):", default: "TRY" }
    ]);
    try {
      if (type === "Döviz") {
        const j = JSON.parse(await curl(`https://api.exchangerate.host/latest?base=${base}&symbols=${target}`, { Accept: "application/json" }, 15));
        console.log(ok(`${base} → ${target}: ${j.rates[target]}`));
      } else {
        const j = JSON.parse(await curl(`https://api.coingecko.com/api/v3/simple/price?ids=${base.toLowerCase()}&vs_currencies=${target.toLowerCase()}`, { Accept: "application/json" }, 15));
        const val = j[base.toLowerCase()]?.[target.toLowerCase()];
        console.log(ok(`${base} → ${target}: ${val}`));
      }
    } catch (e) {
      console.log(err("Fiyat alınamadı: " + e.message));
    }
  }

  // 5) Metin özetleme (basit, kelime sayısına göre)
  async function summarizeMenu() {
    const { text } = await inquirer.prompt([{ type: "editor", name: "text", message: "Metin girin (editörde):" }]);
    if (!text) {
      console.log(warn("Boş metin."));
      return;
    }
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const wordCount = text.split(/\s+/).length;
    const limit = Math.min(sentences.length, 3);
    console.log(title("Özet:"));
    console.log(sentences.slice(0, limit).join(" "));
    console.log(dim(`(${wordCount} kelime)`));
  }

  // 6) PDF → TTS (PDF metni çıkar, seslendir)
  async function pdfTtsMenu() {
    const { filepath } = await inquirer.prompt([{ type: "input", name: "filepath", message: "PDF dosya yolu:" }]);
    try {
      const pdfModule = await import("pdf-parse");
      const data = await pdfModule.default(await fs.readFile(filepath));
      const text = data.text;
      if (!text) {
        console.log(err("Metin çıkartılamadı."));
        return;
      }
      console.log(ok("Metin okundu, seslendiriliyor..."));
      await ttsSay(text.slice(0, 1000));  // uzunluk sınırlaması
    } catch (e) {
      console.log(err("PDF okunamadı / eksik modül: " + e.message));
    }
  }

  // 7) Doğal dil hatırlatıcı (örneğin “yarın sabah 9'da toplantı”)
  async function naturalReminderMenu() {
    const { phrase } = await inquirer.prompt([{ type: "input", name: "phrase", message: "Hatırlatma ifadesi:" }]);
    // Basit versiyon: “X dakika/ saat sonra” gibi akıllı parse yok; kullanıcı ayrıca süre belirtmeli
    console.log(warn("Bu özellik gelişmiş NLP gerektirir; şimdilik geçici sürüm."));
    const { howlong, message } = await inquirer.prompt([
      { type: "input", name: "howlong", message: "Kaç dakika/ saat sonra?" },
      { type: "input", name: "message", message: "Hatırlatma mesajı:" }
    ]);
    // parse to dakika (örn: “30m”, “2h”)
    let ms = 0;
    const m = howlong.match(/(\d+)\s*(m|h)/i);
    if (m) {
      const v = parseInt(m[1]);
      if (m[2].toLowerCase() === "h") ms = v * 3600000;
      else ms = v * 60000;
    }
    if (ms <= 0) {
      console.log(err("Geçersiz süre."));
      return;
    }
    await scheduleCountdown(ms, message);
    console.log(ok("Hatırlatma planlandı."));
  }

  // 8) Harcama takip
  async function expenseMenu() {
    const s = await readStore();
    s.expenses ||= [];
    const { op } = await inquirer.prompt([{ type: "list", name: "op", message: "Harcama Takip:", choices: ["Ekle", "Listele", "Sil", "Geri"] }]);
    if (op === "Geri") return;
    if (op === "Ekle") {
      const a = await inquirer.prompt([
        { type: "input", name: "title", message: "Açıklama:" },
        { type: "number", name: "amount", message: "Tutar:" }
      ]);
      s.expenses.push({ title: a.title, amount: a.amount, ts: DateTime.now().toISO() });
      await writeStore(s);
      console.log(ok("Eklendi."));
    }
    if (op === "Listele") {
      console.log(title("Harcamalar:"));
      s.expenses.forEach((e, i) => {
        console.log(`${ok(i + 1)}) ${e.title}: ${e.amount} | ${dim(e.ts)}`);
      });
      printDivider();
    }
    if (op === "Sil") {
      const { idx } = await inquirer.prompt([{ type: "number", name: "idx", message: "Silinecek #" }]);
      if (s.expenses[idx - 1]) {
        s.expenses.splice(idx - 1, 1);
        await writeStore(s);
        console.log(ok("Silindi."));
      } else {
        console.log(err("Bulunamadı."));
      }
    }
  }

  // 9) Pano araçları (clipboard)
  async function clipboardMenu() {
    const { op } = await inquirer.prompt([{ type: "list", name: "op", message: "Pano işlemi:", choices: ["Yazdır", "Temizle", "Geri"] }]);
    if (op === "Geri") return;
    if (op === "Yazdır") {
      const data = process.env.CLIPBOARD || "";
      console.log(ok("Pano içeriği:"));
      console.log(data);
    } else if (op === "Temizle") {
      process.env.CLIPBOARD = "";
      console.log(ok("Pano temizlendi."));
    }
  }

  // 10) Mesaj şablonları
  async function templatesMenu() {
    const s = await readStore();
    s.templates ||= {};
    const { op } = await inquirer.prompt([{ type: "list", name: "op", message: "Şablonlar:", choices: ["Ekle", "Listele", "Sil", "Kullan", "Geri"] }]);
    if (op === "Geri") return;
    if (op === "Ekle") {
      const a = await inquirer.prompt([
        { type: "input", name: "key", message: "Ad:" },
        { type: "editor", name: "body", message: "İçerik:" }
      ]);
      s.templates[a.key] = a.body;
      await writeStore(s);
      console.log(ok("Şablon kaydedildi."));
    }
    if (op === "Listele") {
      console.log(title("Şablonlar:"));
      Object.entries(s.templates).forEach(([k, v]) => {
        console.log(`${ok(k)} → ${v.split("\n")[0].slice(0, 50)}...`);
      });
      printDivider();
    }
    if (op === "Sil") {
      const { key } = await inquirer.prompt([{ type: "input", name: "key", message: "Silinecek şablon adı:" }]);
      delete s.templates[key];
      await writeStore(s);
      console.log(ok("Silindi."));
    }
    if (op === "Kullan") {
      const { key } = await inquirer.prompt([{ type: "input", name: "key", message: "Şablon adı:" }]);
      const body = s.templates[key];
      if (!body) {
        console.log(err("Bulunamadı."));
        return;
      }
      console.log(title("İçerik:"));
      console.log(body);
      printDivider();
    }
  }

  // 11) Medya aç + hatırlat
  async function mediaMenu() {
    const { url, delay } = await inquirer.prompt([
      { type: "input", name: "url", message: "Medya URL / sayfa:" },
      { type: "input", name: "delay", message: "Kaç saniye sonra aç?", default: "0" }
    ]);
    const secs = parseInt(delay) || 0;
    if (secs > 0) {
      await scheduleCountdown(secs * 1000, "Medya Aç: " + url);
      console.log(ok(`Planlandı ${secs} sn sonra açılacak.`));
    } else {
      await open(url);
      console.log(ok("Açıldı."));
    }
  }

  // 12) Konfor kısayolları (örn: sessiz modu aç, ekran parlaklığı, vs. placeholder)
  async function comfortShortcutsMenu() {
    console.log(warn("Konfor kısayolları henüz tamamlanmadı."));
  }

  return {
    calendarMenu,
    emailDigestMenu,
    newsMenu,
    pricesMenu,
    summarizeMenu,
    pdfTtsMenu,
    naturalReminderMenu,
    expenseMenu,
    clipboardMenu,
    templatesMenu,
    mediaMenu,
    comfortShortcutsMenu
  };
}
