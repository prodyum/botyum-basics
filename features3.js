// features3.js
// “Bugünüm”, harita bağlantısı, paket takip, zaman dilimi dönüştürme, CSV istatistik,
// sistem bilgi, sözlük (EN/TR), YouTube arama + medya, sosyal arama, alıntı/şiir

import { htmlToText } from "html-to-text";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { DateTime } from "luxon";

export function registerFeatures3(ctx) {
  const {
    inquirer,
    ok,
    err,
    warn,
    dim,
    title,
    printDivider,
    curl,
    readStore,
    writeStore,
    open
  } = ctx;

  // 1) Bugünüm nasıl? — takvim, hava, hatırlatıcı özet
  async function todayOverviewMenu() {
    console.log(title("Bugünüm Özeti"));
    // Takvim özet
    try {
      const s = await readStore();
      const now = DateTime.now().toISODate();
      if (s.alarms) {
        const todays = s.alarms.filter(a => a.when.startsWith(now));
        console.log(dim("Bugünkü hatırlatıcılar:"));
        todays.forEach((a,i) => console.log(`${i+1}) ${a.message} @ ${a.when}`));
      }
    } catch {}
    printDivider();
    // Hava durumu sorgusu iste
    const { weather } = await inquirer.prompt([{ type: "confirm", name: "weather", message: "Hava durumu görmek ister misin?" }]);
    if (weather) {
      const { place } = await inquirer.prompt([{ type: "input", name: "place", message: "Şehir / yer adı:" }]);
      try {
        const geo = JSON.parse(await curl(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=tr&format=json`,
          { Accept: "application/json" }, 15
        ));
        const loc = geo.results && geo.results[0];
        if (!loc) {
          console.log(err("Konum bulunamadı."));
        } else {
          const lat = loc.latitude, lon = loc.longitude, tz = loc.timezone;
          const w = JSON.parse(await curl(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=${encodeURIComponent(tz)}`,
            { Accept: "application/json" }, 15
          ));
          console.log(ok(`Şu an: ${w.current.temperature_2m}°C`));
        }
      } catch (e) {
        console.log(err("Hava durumu alınamadı: " + e.message));
      }
    }
    printDivider();
  }

  // 2) Harita bağlantısı (Apple / Google / Yandex)
  async function mapsDeepLinkMenu() {
    const { svc, loc } = await inquirer.prompt([
      { type: "list", name: "svc", message: "Servis:", choices: ["Google Maps","Yandex Maps","Apple Maps"] },
      { type: "input", name: "loc", message: "Yer (ilçe/mahalle/semt vs.):" }
    ]);
    const q = encodeURIComponent(loc);
    let url = "";
    if (svc === "Google Maps") url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    else if (svc === "Yandex Maps") url = `https://yandex.com.tr/maps/?text=${q}`;
    else if (svc === "Apple Maps") url = `https://maps.apple.com/?q=${q}`;
    console.log(ok(url));
  }

  // 3) Paket / kargo takip (basit web arama)
  async function packageTrackMenu() {
    const { code } = await inquirer.prompt([{ type: "input", name: "code", message: "Takip numarası / kod:" }]);
    const url = `https://www.google.com/search?q=${encodeURIComponent("kargo takip " + code)}`;
    console.log(ok(url));
  }

  // 4) Zaman dilimi dönüştürme
  async function tzConverterMenu() {
    const { src, time, dstZone } = await inquirer.prompt([
      { type: "input", name: "src", message: "Kaynak zaman dilimi (TZ adı):", default: "UTC" },
      { type: "input", name: "time", message: "Zaman (ISO ya da HH:mm):", default: DateTime.now().toISO() },
      { type: "input", name: "dstZone", message: "Hedef TZ:", default: "UTC" }
    ]);
    const dt = DateTime.fromISO(time, { zone: src });
    if (!dt.isValid) {
      console.log(err("Geçersiz zaman."));
      return;
    }
    const conv = dt.setZone(dstZone);
    console.log(ok(`${dt.toFormat("yyyy-MM-dd HH:mm:ss ZZZZ")} → ${conv.toFormat("yyyy-MM-dd HH:mm:ss ZZZZ")}`));
  }

  // 5) CSV mini istatistik (ortalama, min, max)
  async function csvMiniStatsMenu() {
    const { filepath } = await inquirer.prompt([{ type: "input", name: "filepath", message: "CSV dosya yolu:" }]);
    try {
      const data = await fs.readFile(filepath, "utf8");
      const lines = data.split(/\r?\n/).filter(l => l.trim());
      const nums = lines.map(l => parseFloat(l.split(",")[1])).filter(n => !isNaN(n));
      if (!nums.length) {
        console.log(err("Sayı verisi yok."));
        return;
      }
      const sum = nums.reduce((a,b) => a+b, 0);
      const avg = sum / nums.length;
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      console.log(ok(`Ortalama: ${avg.toFixed(2)}, Min: ${min}, Max: ${max}`));
    } catch (e) {
      console.log(err("CSV okunamadı: " + e.message));
    }
  }

  // 6) Sistem bilgisi (CPU, RAM, OS)
  function systemInfoMenu() {
    console.log(title("Sistem Bilgisi:"));
    console.log(dim("Platform:"), os.platform(), os.type(), os.arch());
    console.log(dim("İşlemci sayısı:"), os.cpus().length);
    console.log(dim("Toplam hafıza (MB):"), (os.totalmem()/1024/1024).toFixed(0));
    console.log(dim("Boş hafıza (MB):"), (os.freemem()/1024/1024).toFixed(0));
  }

  // 7) Sözlük EN ↔ TR arama (dictionaryapi.dev ya da benzeri)
  async function dictionaryMenu() {
    const { word, dir } = await inquirer.prompt([
      { type: "input", name: "word", message: "Kelime:" },
      { type: "list", name: "dir", message: "Yön:", choices: ["EN→TR", "TR→EN"] }
    ]);
    let api = "";
    if (dir === "EN→TR") {
      api = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    } else {
      // TR→EN: basit olarak İngilizce çeviri kullan
      api = `https://libretranslate.de/translate`;
    }
    try {
      if (dir === "EN→TR") {
        const j = JSON.parse(await curl(api, { Accept: "application/json" }, 15));
        j[0]?.meanings?.forEach(m => {
          console.log(ok(m.partOfSpeech));
          (m.definitions || []).slice(0,3).forEach(d => console.log(" - " + d.definition));
        });
      } else {
        const body = JSON.stringify({ q: word, source: "tr", target: "en", format: "text" });
        const res = await curl(api, { "Content-Type": "application/json", "Accept": "application/json" }, 15, "POST", body);
        const j = JSON.parse(res);
        console.log(ok(`${word} → ${j.translatedText}`));
      }
    } catch (e) {
      console.log(err("Sözlük hatası: " + e.message));
    }
  }

  // 8) YouTube arama + link göster
  async function mediaSearchMenu() {
    const { q } = await inquirer.prompt([{ type: "input", name: "q", message: "Aranacak video / medya:" }]);
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent("site:youtube.com " + q)}`;
      const html = await curl(url, { Accept: "text/html" }, 15);
      const results = [];
      const rx = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gsi;
      let m;
      while ((m = rx.exec(html)) !== null) {
        const u = m[1];
        const t = m[2].replace(/<[^>]+>/g, "").trim();
        if (u && t && u.includes("youtube.com")) results.push({ title: t, url: u });
        if (results.length >= 10) break;
      }
      results.forEach((r,i) => {
        console.log(`${ok(String(i+1).padStart(2,"0"))}) ${r.title}\n   ${dim(r.url)}`);
      });
    } catch (e) {
      console.log(err("Medya arama hatası: " + e.message));
    }
  }

  // 9) Sosyal medya arama (FB / IG / Twitter / LinkedIn) – sınırlı, HTML parse
  async function socialSearchMenu() {
    const { q } = await inquirer.prompt([{ type: "input", name: "q", message: "Aranacak ifade:" }]);
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
    try {
      const html = await curl(url, { Accept: "text/html" }, 15);
      const results = [];
      const rx = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gsi;
      let m;
      while ((m = rx.exec(html)) !== null) {
        const u = m[1];
        const t = m[2].replace(/<[^>]+>/g, "").trim();
        if (u && t) results.push({ title: t, url: u });
        if (results.length >= 10) break;
      }
      console.log(title("Sosyal Arama Sonuçları:"));
      results.forEach((r,i) => {
        console.log(`${ok(String(i+1).padStart(2,"0"))}) ${r.title}\n   ${dim(r.url)}`);
      });
    } catch (e) {
      console.log(err("Sosyal arama hatası: " + e.message));
    }
  }

  // 10) Alıntı / Şiir / Random içerik (örneğin quote API)
  async function quotePoemMenu() {
    try {
      const j = JSON.parse(await curl("https://api.quotable.io/random", { Accept: "application/json" }, 10));
      console.log(ok(`"${j.content}" — ${j.author}`));
    } catch (e) {
      console.log(err("Alıntı alınamadı: " + e.message));
    }
  }

  return {
    todayOverviewMenu,
    mapsDeepLinkMenu,
    packageTrackMenu,
    tzConverterMenu,
    csvMiniStatsMenu,
    systemInfoMenu,
    dictionaryMenu,
    mediaSearchMenu,
    socialSearchMenu,
    quotePoemMenu
  };
}
