// features1.js
// "Çekirdek" modül — zaman/saat, hesap makinesi, tarayıcı açma, curl sayfa çekme,
// Google arama, link üretme (tel/sms/WhatsApp), Wikipedia Q&A, birim dönüşüm, zamanlayıcı/alarmlar,
// notlar & ToDo, çeviri, hava durumu, TTS, ayarlar.

import { htmlToText } from "html-to-text";

export function registerFeatures1(ctx) {
  const {
    inquirer,
    ok,
    err,
    warn,
    dim,
    title,
    printDivider,
    sleep,
    curl,
    readStore,
    writeStore,
    ttsSay,
    isWindows,
    isMac,
    open,
    DateTime,
    Interval,
    Duration,
    ct,
    getCountryCode,
    math,
    htmlToText,
    Table
  } = ctx;

  function sanitizeUrl(u) {
    return /^https?:\/\//i.test(u) ? u : "https://" + u;
  }
  function encodeTr(s) {
    return encodeURIComponent(s);
  }

  function countryToTZs(countryInput) {
    let code = (countryInput || "").trim();
    if (!code) return [];
    if (code.length > 2) {
      const maybe = getCountryCode(countryInput);
      if (maybe) code = maybe;
    }
    code = code.toUpperCase();
    const info = ct.getTimezonesForCountry(code);
    if (!info || !info.length) return [];
    return info.map(z => z.name);
  }

  // 1) Tarih & Saat araçları
  async function timeAndDateMenu() {
    while (true) {
      const { action } = await inquirer.prompt([{
        type: "list",
        name: "action",
        message: "Tarih/Saat araçları:",
        choices: [
          { name: "Ülkeye göre şu anki tarih ve saat", value: "now-country" },
          { name: "Bir tarihin haftanın hangi gününe denk geldiğini bul", value: "dow" },
          { name: "İki tarih/saat arasındaki farkı hesapla", value: "diff" },
          { name: "Bir tarih/saat üzerine süre ekle/çıkar", value: "add-sub" },
          { name: "Geri dön", value: "back" }
        ]
      }]);
      if (action === "back") return;

      try {
        if (action === "now-country") {
          const { country } = await inquirer.prompt([{ type: "input", name: "country", message: "Ülke adı/ISO (ör: Türkiye/TR):" }]);
          const tzs = countryToTZs(country);
          if (!tzs.length) {
            console.log(err("Ülke / saat dilimi bulunamadı."));
            continue;
          }
          for (const tz of tzs) {
            const now = DateTime.now().setZone(tz);
            console.log(`${ok(tz)} -> ${now.toFormat("yyyy-MM-dd HH:mm:ss ZZZZ")} (${now.weekdayLong})`);
          }
          printDivider();
        }

        if (action === "dow") {
          const { date } = await inquirer.prompt([{ type: "input", name: "date", message: "Tarih (ISO, ör: 2025-10-03 veya 2025-10-03T14:30):" }]);
          const dt = DateTime.fromISO(date, { setZone: true });
          if (!dt.isValid) {
            console.log(err("Geçersiz tarih/saat."));
            continue;
          }
          console.log(`${ok(dt.toFormat("yyyy-MM-dd"))} -> ${dt.weekdayLong}`);
          printDivider();
        }

        if (action === "diff") {
          const { a, b } = await inquirer.prompt([
            { type: "input", name: "a", message: "Başlangıç (ISO):" },
            { type: "input", name: "b", message: "Bitiş (ISO):" }
          ]);
          const A = DateTime.fromISO(a, { setZone: true });
          const B = DateTime.fromISO(b, { setZone: true });
          if (!A.isValid || !B.isValid) {
            console.log(err("Geçersiz tarih/saat."));
            continue;
          }
          const iv = Interval.fromDateTimes(A, B);
          const dur = iv.toDuration(["years", "months", "days", "hours", "minutes", "seconds"]);
          console.log(ok(`Fark: ${dur.toHuman({ maximumFractionDigits: 2 })}`));
          console.log(dim(`Saat: ${iv.length("hours").toFixed(2)} | Dakika: ${iv.length("minutes").toFixed(2)}`));
          printDivider();
        }

        if (action === "add-sub") {
          const q = await inquirer.prompt([
            { type: "input", name: "base", message: "Taban ISO (boş: şimdi):" },
            { type: "list", name: "op", message: "İşlem", choices: ["Ekle", "Çıkar"] },
            { type: "number", name: "years", message: "Yıl:", default: 0 },
            { type: "number", name: "months", message: "Ay:", default: 0 },
            { type: "number", name: "days", message: "Gün:", default: 0 },
            { type: "number", name: "hours", message: "Saat:", default: 0 },
            { type: "number", name: "minutes", message: "Dakika:", default: 0 },
            { type: "number", name: "seconds", message: "Saniye:", default: 0 }
          ]);
          let dt = q.base
            ? DateTime.fromISO(q.base, { setZone: true })
            : DateTime.now();
          if (!dt.isValid) {
            console.log(err("Geçersiz tarih/saat."));
            continue;
          }
          const dur = Duration.fromObject(q);
          dt = q.op === "Ekle" ? dt.plus(dur) : dt.minus(dur);
          console.log(
            ok(`Sonuç: ${dt.toISO()} | ${dt.toFormat("yyyy-MM-dd HH:mm:ss ZZZZ")}`)
          );
          printDivider();
        }
      } catch (e) {
        console.log(err(e.message));
      }
    }
  }

  // 2) Gelişmiş Hesap Makinesi
  async function calculatorMenu() {
    console.log(dim("İpucu: birim dönüşümleri desteklenir. Örn: 5 cm + 2 inch, to(5 N*m, J)"));
    while (true) {
      const { expr } = await inquirer.prompt([{ type: "input", name: "expr", message: "İfade (boş: çık):" }]);
      if (!expr) return;
      try {
        console.log(ok(`= ${math.evaluate(expr)}`));
      } catch (e) {
        console.log(err(`Hata: ${e.message}`));
      }
    }
  }

  // 3) Varsayılan tarayıcıda aç
  async function openInBrowser() {
    const { url } = await inquirer.prompt([{ type: "input", name: "url", message: "Açılacak URL:" }]);
    const u = sanitizeUrl(url);
    await open(u);
    console.log(ok(`Açıldı: ${u}`));
  }

  // 4) curl ile sayfa çek & metin göster
  async function fetchAndShow() {
    const { url } = await inquirer.prompt([{ type: "input", name: "url", message: "Çekilecek URL:" }]);
    try {
      const html = await curl(sanitizeUrl(url));
      const text = htmlToText(html, {
        wordwrap: 100,
        selectors: [{ selector: "a", options: { ignoreHref: true } }]
      });
      printDivider();
      console.log(title("Sayfa Metni:"));
      console.log(text.slice(0, 20000));
      printDivider();
    } catch (e) {
      console.log(err(e.message));
    }
  }

  // 5) Google Arama (DDG yedekli)
  function parseGoogleResults(html) {
    const results = [];
    const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gsi;
    let m, i = 1;
    while ((m = h3Regex.exec(html)) !== null) {
      const titleTxt = m[1].replace(/<[^>]+>/g, "").trim();
      const chunkStart = Math.max(0, m.index - 3000);
      const chunk = html.slice(chunkStart, m.index + m[0].length + 1000);
      const urlm = chunk.match(/\/url\?q=([^"&]+)[^>]*>/i);
      if (titleTxt && urlm) {
        const url = decodeURIComponent(urlm[1]);
        if (
          !url.includes("webcache.googleusercontent.com") &&
          !url.includes("/search?") &&
          !url.startsWith("/")
        ) {
          results.push({ i: i++, title: titleTxt, url });
        }
      }
      if (results.length >= 10) break;
    }
    return results;
  }
  function parseDDG(html) {
    const results = [];
    const rx = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gsi;
    let i = 1, m;
    while ((m = rx.exec(html)) !== null) {
      const url = m[1];
      const t = m[2].replace(/<[^>]+>/g, "").trim();
      if (t && url) results.push({ i: i++, title: t, url });
      if (results.length >= 10) break;
    }
    return results;
  }
  async function googleSearchCurl() {
    const { q } = await inquirer.prompt([{ type: "input", name: "q", message: "Google’da aranacak ifade:" }]);
    const url = `https://www.google.com/search?hl=tr&num=10&q=${encodeTr(q)}`;
    try {
      const html = await curl(url, { Accept: "text/html,application/xhtml+xml" });
      let results = parseGoogleResults(html);
      if (!results.length) {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeTr(q)}`;
        const ddg = await curl(ddgUrl);
        results = parseDDG(ddg);
        console.log(warn("Google parse edilemedi, DuckDuckGo sonuçları kullanıldı."));
      }
      if (!results.length) {
        console.log(err("Sonuç bulunamadı veya erişim engellendi."));
        return;
      }
      printDivider();
      console.log(title(`Arama sonuçları: ${q}`));
      results.forEach(r => console.log(`${ok(String(r.i).padStart(2, "0"))}) ${r.title}\n    ${dim(r.url)}`));
      printDivider();
    } catch (e) {
      console.log(err(e.message));
    }
  }

  // 6) Tel / SMS / WhatsApp link üretme
  function buildTelLink(n) {
    return `tel:${n.replace(/\s+/g, "")}`;
  }
  function buildSmsLink(n, b) {
    return `sms:${n.replace(/\s+/g, "")}?&body=${encodeTr(b || "")}`;
  }
  function buildWhatsAppLink(n, t) {
    return `https://wa.me/${n.replace(/\D+/g, "")}?text=${encodeTr(t || "")}`;
  }
  async function linkMenu() {
    const { action } = await inquirer.prompt([{
      type: "list",
      name: "action",
      message: "Bağlantı türü:",
      choices: [
        { name: "Telefon ara (tel: link)", value: "tel" },
        { name: "SMS gönder (sms: link)", value: "sms" },
        { name: "WhatsApp mesaj (wa.me link)", value: "wa" },
        { name: "Geri dön", value: "back" }
      ]
    }]);
    if (action === "back") return;
    let link;
    if (action === "tel") {
      const { num } = await inquirer.prompt([{ type: "input", name: "num", message: "Telefon (+90...):" }]);
      link = buildTelLink(num);
    }
    if (action === "sms") {
      const a = await inquirer.prompt([
        { type: "input", name: "num", message: "Telefon:" },
        { type: "input", name: "msg", message: "Mesaj:" }
      ]);
      link = buildSmsLink(a.num, a.msg);
    }
    if (action === "wa") {
      const a = await inquirer.prompt([
        { type: "input", name: "num", message: "Telefon:" },
        { type: "input", name: "msg", message: "Mesaj:" }
      ]);
      link = buildWhatsAppLink(a.num, a.msg);
    }
    console.log(ok(link));
    printDivider();
    const { openIt } = await inquirer.prompt([{ type: "confirm", name: "openIt", message: "Tarayıcıda aç?" , default: false }]);
    if (openIt) {
      await open(link);
      console.log(dim("Açıldı."));
    }
  }

  // 7) Wikipedia Q&A
  async function wikiQAMenu() {
    const { question } = await inquirer.prompt([{ type: "input", name: "question", message: "Soru (kimdir, nedir, vs.):" }]);
    const q = question.trim().replace(/(nedir|niçindir|kimdir|nasıldır|nerededir|ne zaman olmuştur|\?|\.|,)/gi, "").trim();
    async function fetchSummary(lang, term) {
      const u = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeTr(term)}`;
      try {
        const jt = await curl(u, { Accept: "application/json" });
        return JSON.parse(jt);
      } catch {
        return null;
      }
    }
    let data = await fetchSummary("tr", q);
    if (!data || data.type?.includes("errors/not_found")) data = await fetchSummary("en", q);
    if (!data) {
      console.log(err("Özet alınamadı."));
      return;
    }
    printDivider();
    console.log(title(data.title || q));
    if (data.extract) console.log(data.extract);
    if (data.content_urls?.desktop?.page) console.log(dim("\nKaynak: " + data.content_urls.desktop.page));
    printDivider();
  }

  // 8) Birim dönüşüm
  async function unitConversionMenu() {
    console.log(dim("Örnek: 5 cm to inch, to(5 N*m, J), 100 km/h to m/s, 37 degC to degF"));
    while (true) {
      const { expr } = await inquirer.prompt([{ type: "input", name: "expr", message: "Dönüştürme ifadesi (boş: çık):" }]);
      if (!expr) return;
      try {
        console.log(ok(String(math.evaluate(expr))));
      } catch (e) {
        console.log(err(e.message));
      }
    }
  }

  // 9) Zamanlayıcı & Alarm
  async function timersMenu() {
    while (true) {
      const store = await readStore();
      const { action } = await inquirer.prompt([{
        type: "list",
        name: "action",
        message: "Zamanlayıcı / Alarm:",
        choices: [
          { name: "Yeni geri sayım (süre sonunda uyar)", value: "countdown" },
          { name: "Zamansal alarm (tarih + saat)", value: "alarm" },
          { name: "Kayıtlı alarmları listele / sil", value: "list" },
          { name: "Geri dön", value: "back" }
        ]
      }]);
      if (action === "back") return;

      if (action === "countdown") {
        const { howlong, message } = await inquirer.prompt([
          { type: "input", name: "howlong", message: "Süre (ör: 5m, 90s, 00:02:00):" },
          { type: "input", name: "message", message: "Mesaj:", default: "Zamanlayıcı bitti!" }
        ]);
        const ms = humanToMs(howlong);
        if (Number.isNaN(ms) || ms <= 0) {
          console.log(err("Geçersiz süre."));
          continue;
        }
        const id = "t-" + Date.now();
        const when = DateTime.now().plus({ milliseconds: ms }).toISO();
        store.alarms ||= [];
        store.alarms.push({ id, type: "countdown", message, when });
        await writeStore(store);
        console.log(ok(`Planlandı (#${id}) → ${DateTime.fromISO(when).toFormat("yyyy-MM-dd HH:mm:ss")}`));
        console.log(dim("Alarm index.js tarafından planlanacak."));
      }

      if (action === "alarm") {
        const { whenStr, message } = await inquirer.prompt([
          { type: "input", name: "whenStr", message: "Zaman (ISO veya bugün HH:mm):" },
          { type: "input", name: "message", message: "Mesaj:", default: "Alarm!" }
        ]);
        let when = DateTime.fromISO(whenStr, { setZone: true });
        if (!when.isValid && /^\d{1,2}:\d{2}$/.test(whenStr)) {
          const [H, M] = whenStr.split(":").map(Number);
          when = DateTime.now().set({ hour: H, minute: M, second: 0, millisecond: 0 });
        }
        if (!when.isValid) {
          console.log(err("Geçersiz zaman."));
          continue;
        }
        if (when.diffNow().toMillis() <= 0) {
          console.log(err("Zaman geçmiş."));
          continue;
        }
        const id = "a-" + Date.now();
        const store2 = await readStore();
        store2.alarms ||= [];
        store2.alarms.push({ id, type: "alarm", message, when: when.toISO() });
        await writeStore(store2);
        console.log(ok(`Alarm kaydedildi (#${id}) → ${when.toFormat("yyyy-MM-dd HH:mm:ss")}`));
        console.log(dim("Alarm index.js tarafından planlanacak."));
      }

      if (action === "list") {
        const s = await readStore();
        if (!s.alarms?.length) {
          console.log(warn("Hiç alarm yok."));
          continue;
        }
        s.alarms.forEach(a => {
          console.log(`${ok(a.id)} | ${a.type} | ${DateTime.fromISO(a.when).toFormat("yyyy-MM-dd HH:mm:ss")} | ${a.message}`);
        });
        const { op } = await inquirer.prompt([{ type: "list", name: "op", message: "İşlem:", choices: [
          { name: "Sil", value: "del" },
          { name: "İptal", value: "cancel" }
        ]}]);
        if (op === "del") {
          const { id } = await inquirer.prompt([{ type: "input", name: "id", message: "Silinecek ID:" }]);
          const idx = s.alarms.findIndex(x => x.id === id);
          if (idx < 0) console.log(err("ID bulunamadı."));
          else {
            s.alarms.splice(idx, 1);
            await writeStore(s);
            console.log(ok("Silindi."));
          }
        }
      }
    }
  }

  function humanToMs(input) {
    const s = String(input).trim().toLowerCase();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
      const parts = s.split(":").map(Number);
      const h = parts[0], m = parts[1], sec = parts[2] || 0;
      return ((h * 60 + m) * 60 + sec) * 1000;
    }
    const rx = /(\d+)\s*(d|h|m|s)/g;
    let ms = 0, m2;
    while ((m2 = rx.exec(s)) !== null) {
      const v = Number(m2[1]), u = m2[2];
      if (u === "d") ms += v * 24 * 3600 * 1000;
      if (u === "h") ms += v * 3600 * 1000;
      if (u === "m") ms += v * 60 * 1000;
      if (u === "s") ms += v * 1000;
    }
    return ms || NaN;
  }

  // 10) Notlar & ToDo
  async function notesTodosMenu() {
    while (true) {
      const { section } = await inquirer.prompt([{
        type: "list",
        name: "section",
        message: "Notlar & ToDo:",
        choices: [
          { name: "Notlar", value: "notes" },
          { name: "ToDo", value: "todos" },
          { name: "Geri dön", value: "back" }
        ]
      }]);
      if (section === "back") return;
      if (section === "notes") await notesMenu();
      if (section === "todos") await todosMenu();
    }
  }
  async function notesMenu() {
    while (true) {
      const s = await readStore();
      s.notes ||= [];
      console.log(title("Notlar:"));
      s.notes.forEach((n, i) =>
        console.log(`${ok(String(i + 1).padStart(2, "0"))}) ${n.title} ${dim(n.created || "")}`)
      );
      const { op } = await inquirer.prompt([{
        type: "list",
        name: "op",
        message: "İşlem:",
        choices: [
          { name: "Yeni not", value: "add" },
          { name: "Notu göster", value: "show" },
          { name: "Sil", value: "del" },
          { name: "Geri", value: "back" }
        ]
      }]);
      if (op === "back") return;
      if (op === "add") {
        const { title: t, body } = await inquirer.prompt([
          { type: "input", name: "title", message: "Başlık:" },
          { type: "editor", name: "body", message: "İçerik:" }
        ]);
        s.notes.push({ title: t, body, created: DateTime.now().toISO() });
        await writeStore(s);
        console.log(ok("Not eklendi."));
      }
      if (op === "show") {
        const { idx } = await inquirer.prompt([{ type: "number", name: "idx", message: "Gösterilecek #:" }]);
        const n = s.notes[idx - 1];
        if (!n) {
          console.log(err("Bulunamadı."));
          continue;
        }
        printDivider();
        console.log(title(n.title));
        console.log(n.body || "(boş)");
        printDivider();
      }
      if (op === "del") {
        const { idx } = await inquirer.prompt([{ type: "number", name: "idx", message: "Silinecek #:" }]);
        if (s.notes[idx - 1]) {
          s.notes.splice(idx - 1, 1);
          await writeStore(s);
          console.log(ok("Silindi."));
        } else {
          console.log(err("Bulunamadı."));
        }
      }
    }
  }
  async function todosMenu() {
    while (true) {
      const s = await readStore();
      s.todos ||= [];
      console.log(title("ToDo:"));
      s.todos.forEach((t, i) =>
        console.log(`${ok(String(i + 1).padStart(2, "0"))}) [${t.done ? "x" : " "}] ${t.title}${t.due ? dim(" (due " + DateTime.fromISO(t.due).toFormat("yyyy-MM-dd HH:mm") + ")") : ""}`)
      );
      const { op } = await inquirer.prompt([{
        type: "list",
        name: "op",
        message: "İşlem:",
        choices: [
          { name: "Ekle", value: "add" },
          { name: "Tamamla / Geri al", value: "toggle" },
          { name: "Sil", value: "del" },
          { name: "Geri", value: "back" }
        ]
      }]);
      if (op === "back") return;
      if (op === "add") {
        const a = await inquirer.prompt([
          { type: "input", name: "title", message: "Başlık:" },
          { type: "input", name: "due", message: "Bitiş (ISO veya boş):" }
        ]);
        const dueISO = a.due ? DateTime.fromISO(a.due, { setZone: true }).toISO() : null;
        s.todos.push({ title: a.title, due: dueISO, done: false, created: DateTime.now().toISO() });
        await writeStore(s);
        console.log(ok("Eklendi."));
      }
      if (op === "toggle") {
        const { idx } = await inquirer.prompt([{ type: "number", name: "idx", message: "#" }]);
        if (s.todos[idx - 1]) {
          s.todos[idx - 1].done = !s.todos[idx - 1].done;
          await writeStore(s);
          console.log(ok("Güncellendi."));
        } else {
          console.log(err("Bulunamadı."));
        }
      }
      if (op === "del") {
        const { idx } = await inquirer.prompt([{ type: "number", name: "idx", message: "Silinecek #" }]);
        if (s.todos[idx - 1]) {
          s.todos.splice(idx - 1, 1);
          await writeStore(s);
          console.log(ok("Silindi."));
        } else {
          console.log(err("Bulunamadı."));
        }
      }
    }
  }

  // 11) Çeviri
  async function translateMenu() {
    const store = await readStore();
    const LT = process.env.LIBRETRANSLATE_URL || store.settings?.libretranslate_url || "https://libretranslate.de";
    while (true) {
      const { text } = await inquirer.prompt([{ type: "input", name: "text", message: "Çevrilecek metin (boş: çık):" }]);
      if (!text) return;
      const { source, target } = await inquirer.prompt([
        { type: "input", name: "source", message: "Kaynak dil (örn: tr, en, auto):", default: "auto" },
        { type: "input", name: "target", message: "Hedef dil (örn: en, tr):", default: "en" }
      ]);
      try {
        const body = JSON.stringify({ q: text, source, target, format: "text" });
        const res = await curl(`${LT}/translate`, { "Content-Type": "application/json", "Accept": "application/json" }, 20, "POST", body);
        const j = JSON.parse(res);
        if (j?.translatedText) console.log(ok(j.translatedText));
        else console.log(err("Çeviri başarısız."));
      } catch (e) {
        console.log(err("Çeviri servisi erişilemedi."));
      }
    }
  }

  // 12) Hava durumu
  async function weatherMenu() {
    const { place } = await inquirer.prompt([{ type: "input", name: "place", message: "Şehir / yer adı (örn: Istanbul):" }]);
    try {
      const geo = await curl(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeTr(place)}&count=1&language=tr&format=json`,
        { Accept: "application/json" },
        15
      );
      const gj = JSON.parse(geo);
      if (!gj.results || !gj.results.length) {
        console.log(err("Konum bulunamadı."));
        return;
      }
      const loc = gj.results[0];
      const lat = loc.latitude, lon = loc.longitude, tz = loc.timezone;
      const w = await curl(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&hourly=temperature_2m,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=${encodeTr(tz)}&forecast_days=7`,
        { Accept: "application/json" },
        15
      );
      const jw = JSON.parse(w);
      console.log(title(`${loc.name}, ${loc.country_code} (${lat.toFixed(2)}, ${lon.toFixed(2)}) – ${tz}`));
      const t = new Table({ head: ["Tarih", "Kod", "Min", "Max", "Yağış (mm)"] });
      jw.daily.time.forEach((d, i) => {
        t.push([d, jw.daily.weathercode[i],
                `${jw.daily.temperature_2m_min[i]}°C`,
                `${jw.daily.temperature_2m_max[i]}°C`,
                jw.daily.precipitation_sum[i]]);
      });
      console.log(t.toString());
      if (jw.current) {
        console.log(
          dim(
            `Şu an: ${jw.current.temperature_2m}°C, Hissedilen ${jw.current.apparent_temperature}°C, Nem %${jw.current.relative_humidity_2m}, Rüzgar ${jw.current.wind_speed_10m} km/s`
          )
        );
      }
      printDivider();
    } catch (e) {
      console.log(err("Hava durumu alınamadı: " + e.message));
    }
  }

  // 13) TTS metin seslendir
  async function ttsMenu() {
    const { text } = await inquirer.prompt([{ type: "input", name: "text", message: "Seslendirilecek metin (boş: çık):" }]);
    if (!text) return;
    await ttsSay(text);
    console.log(ok("Seslendirildi (mümkünse)."));
  }

  // 14) Ayarlar
  async function settingsMenu() {
    const s = await readStore();
    s.settings ||= { libretranslate_url: "https://libretranslate.de", tts_enabled: true };
    console.log(title("Ayarlar"));
    console.log("LibreTranslate URL:", s.settings.libretranslate_url);
    console.log("TTS etkin:", s.settings.tts_enabled ? "evet" : "hayır");
    const { op } = await inquirer.prompt([{
      type: "list",
      name: "op",
      message: "Ayar değiştir:",
      choices: [
        { name: "LibreTranslate URL değiştir", value: "lt" },
        { name: "TTS aç / kapat", value: "tts" },
        { name: "Geri dön", value: "back" }
      ]
    }]);
    if (op === "back") return;
    if (op === "lt") {
      const { url } = await inquirer.prompt([{ type: "input", name: "url", message: "Yeni LibreTranslate URL:" }]);
      s.settings.libretranslate_url = url;
      await writeStore(s);
      console.log(ok("Güncellendi."));
    }
    if (op === "tts") {
      s.settings.tts_enabled = !s.settings.tts_enabled;
      await writeStore(s);
      console.log(ok("Güncellendi."));
    }
  }

  return {
    timeAndDateMenu,
    calculatorMenu,
    openInBrowser,
    fetchAndShow,
    googleSearchCurl,
    linkMenu,
    wikiQAMenu,
    unitConversionMenu,
    timersMenu,
    notesTodosMenu,
    translateMenu,
    weatherMenu,
    ttsMenu,
    settingsMenu
  };
}
