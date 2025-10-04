// features5.js
// Eğlence + Sözlük + Medya + Finans yardımcıları
// registerFeatures5(ctx) -> menü fonksiyonları döndürür.
//
// Beklenen ctx alanları:
// { inquirer, ok, err, warn, dim, title, printDivider, curl, readStore, writeStore, open, DateTime }

import fs from "fs-extra";
import path from "path";
import { DateTime } from "luxon";

export function registerFeatures5(ctx) {
  const { inquirer, ok, err, warn, dim, title, printDivider, curl, open, DateTime: LuxonDateTime } = ctx;

  const CACHE_DIR = path.join(process.cwd(), "cache");
  fs.ensureDirSync(CACHE_DIR);

  // ──────────────────────────────────────────────────────────────────────────
  // Yardımcılar

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function parseDDG(html, siteFilter = null, limit = 15) {
    const results = [];
    const rx = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gsi;
    let m, i = 1;
    while ((m = rx.exec(html)) !== null) {
      const url = m[1];
      const title = m[2].replace(/<[^>]+>/g, "").trim();
      if (!title || !url) continue;
      if (siteFilter && !url.includes(siteFilter)) continue;
      results.push({ i: i++, title, url });
      if (results.length >= limit) break;
    }
    return results;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1) Altılı tek zar
  function rollSingleDie() {
    const v = Math.floor(Math.random() * 6) + 1;
    console.log(ok(`🎲 ${v}`));
  }

  // 2) Altılı çift zar
  function rollDoubleDice() {
    const a = Math.floor(Math.random() * 6) + 1;
    const b = Math.floor(Math.random() * 6) + 1;
    console.log(ok(`🎲 ${a} + ${b} = ${a + b}`));
  }

  // 3) Yazı tura
  function coinFlip() {
    const side = Math.random() < 0.5 ? "Yazı" : "Tura";
    console.log(ok(`🪙 ${side}`));
  }

  // 4) Rastgele sayı (aralık)
  async function randomNumberMenu() {
    const { min, max } = await inquirer.prompt([
      { type: "number", name: "min", message: "Alt sınır:", default: 1 },
      { type: "number", name: "max", message: "Üst sınır:", default: 100 },
    ]);
    if (Number.isNaN(min) || Number.isNaN(max) || max < min) {
      console.log(err("Geçersiz aralık."));
      return;
    }
    const val = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(ok(`🎯 ${val}`));
  }

  // 5) Taş-Kağıt-Makas
  async function rockPaperScissors() {
    const choices = ["Taş", "Kağıt", "Makas"];
    const { user } = await inquirer.prompt([{ type: "list", name: "user", message: "Seçimin:", choices }]);
    const cpu = choices[Math.floor(Math.random() * 3)];
    console.log(dim(`Bilgisayar: ${cpu}`));
    if (user === cpu) console.log(warn("Berabere!"));
    else if (
      (user === "Taş" && cpu === "Makas") ||
      (user === "Kağıt" && cpu === "Taş") ||
      (user === "Makas" && cpu === "Kağıt")
    ) console.log(ok("Kazandın!"));
    else console.log(err("Kaybettin!"));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6) English→English sözlük (dictionaryapi.dev)
  async function englishDictionary() {
    const { word } = await inquirer.prompt([{ type: "input", name: "word", message: "Kelime (EN):" }]);
    if (!word) return;
    try {
      const j = JSON.parse(
        await curl(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
          { Accept: "application/json" },
          20
        )
      );
      const entry = j[0];
      if (!entry) {
        console.log(warn("Tanım bulunamadı."));
        return;
      }
      (entry.meanings || []).forEach((m, idx) => {
        console.log(ok(`${idx + 1}) ${m.partOfSpeech}`));
        (m.definitions || []).slice(0, 3).forEach((d) => console.log(`   - ${d.definition}`));
      });
      printDivider();
    } catch (e) {
      console.log(err("Sözlük hatası: " + e.message));
    }
  }

  // 7) Çok dilli sözlük (LibreTranslate ile basit çeviri)
  async function multiLangDictionary() {
    const { word, from, to } = await inquirer.prompt([
      { type: "input", name: "word", message: "Kelime/ifade:" },
      { type: "input", name: "from", message: "Kaynak dil (ör: tr)", default: "tr" },
      { type: "input", name: "to", message: "Hedef dil (ör: en)", default: "en" },
    ]);
    if (!word) return;
    try {
      const res = await curl(
        `https://libretranslate.de/translate`,
        { "Content-Type": "application/json", Accept: "application/json" },
        20,
        "POST",
        JSON.stringify({ q: word, source: from, target: to, format: "text" })
      );
      const j = JSON.parse(res);
      console.log(ok(`${word} → ${j.translatedText}`));
    } catch (e) {
      console.log(err("Çeviri hatası: " + e.message));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8) Kronometre
  async function stopwatchMenu() {
    let running = false;
    let startTime = 0;
    let elapsed = 0;
    while (true) {
      const { act } = await inquirer.prompt([{
        type: "list", name: "act", message: "Kronometre:",
        choices: [
          { name: "Başlat", value: "start" },
          { name: "Duraklat", value: "pause" },
          { name: "Sıfırla", value: "reset" },
          { name: "Çık", value: "exit" }
        ]
      }]);
      if (act === "exit") return;
      if (act === "start") {
        if (!running) { startTime = Date.now() - elapsed; running = true; }
        while (running) {
          const diff = Date.now() - startTime;
          process.stdout.write("\r⏱️  " + (diff / 1000).toFixed(1) + " sn   ");
          await sleep(100);
        }
      }
      if (act === "pause") {
        if (running) {
          elapsed = Date.now() - startTime;
          running = false;
          console.log("\n" + warn(`Duraklatıldı: ${(elapsed / 1000).toFixed(1)} sn`));
        }
      }
      if (act === "reset") {
        elapsed = 0; running = false; console.log(ok("Sıfırlandı."));
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 9) Podcast arama (iTunes Search API)
  async function podcastSearchMenu() {
    const { term } = await inquirer.prompt([{ type: "input", name: "term", message: "Podcast araması:" }]);
    if (!term) return;
    try {
      const j = JSON.parse(
        await curl(
          `https://itunes.apple.com/search?media=podcast&term=${encodeURIComponent(term)}`,
          { Accept: "application/json" },
          20
        )
      );
      const items = (j.results || []).slice(0, 12);
      if (!items.length) { console.log(warn("Sonuç bulunamadı.")); return; }
      console.log(title("Podcast Sonuçları:"));
      items.forEach((p, i) => {
        console.log(`${ok(String(i + 1).padStart(2, "0"))}) ${p.collectionName}\n   ${dim(p.feedUrl || p.collectionViewUrl)}`);
      });
      printDivider();
    } catch (e) {
      console.log(err("Podcast alınamadı: " + e.message));
    }
  }

  // 10) YouTube video arama (link döndür)
  async function youtubeSearchMenu() {
    const { q } = await inquirer.prompt([{ type: "input", name: "q", message: "YouTube araması:" }]);
    if (!q) return;
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent("site:youtube.com " + q)}`;
      const html = await curl(url, { Accept: "text/html" }, 20);
      const res = parseDDG(html, "youtube.com", 12);
      if (!res.length) { console.log(warn("Sonuç yok.")); return; }
      console.log(title("YouTube Arama Sonuçları:"));
      res.forEach((r) => console.log(`${ok(String(r.i).padStart(2, "0"))}) ${r.title}\n   ${dim(r.url)}`));
      printDivider();
    } catch (e) {
      console.log(err("Arama hatası: " + e.message));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 11) Spor maç sonuçlarını bul (hızlı web araması)
  async function sportsResultsMenu() {
    const { sport, scope } = await inquirer.prompt([
      { type: "list", name: "sport", message: "Spor dalı:", choices: ["futbol", "basketbol", "voleybol", "diğer"] },
      { type: "input", name: "scope", message: "Ülke/Lig/Takım/Organizasyon:" }
    ]);
    const q = `${sport} ${scope} skor sonuç`;
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      const html = await curl(url, { Accept: "text/html" }, 20);
      const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      console.log(title("Özet (ilk 400 karakter, bağlantılar arama sonuçlarında):"));
      console.log(text.slice(0, 400) + " …");
      printDivider();
    } catch (e) {
      console.log(err("Spor sonuçları alınamadı: " + e.message));
    }
  }

  // 12) Apple Music & Amazon Music arama (link döndür)
  async function musicSearchMenu() {
    const { site, term } = await inquirer.prompt([
      { type: "list", name: "site", message: "Platform:", choices: ["Apple Music", "Amazon Music"] },
      { type: "input", name: "term", message: "Şarkı / sanatçı:" }
    ]);
    if (!term) return;
    const domain = site === "Apple Music" ? "music.apple.com" : "music.amazon.com";
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:${domain} ${term}`)}`;
      const html = await curl(url, { Accept: "text/html" }, 20);
      const res = parseDDG(html, domain, 12);
      if (!res.length) { console.log(warn("Sonuç yok.")); return; }
      console.log(title(`${site} Sonuçları:`));
      res.forEach((r) => console.log(`${ok(String(r.i).padStart(2, "0"))}) ${r.title}\n   ${dim(r.url)}`));
      printDivider();
    } catch (e) {
      console.log(err("Arama hatası: " + e.message));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 13) Para işlemleri (yüzde & KDV örnekleri)
  async function moneyCalcMenu() {
    const { expr } = await inquirer.prompt([
      { type: "input", name: "expr", message: "İfade (örn: 200 doların yüzde 15'i / 120 TL + %20 KDV):" }
    ]);
    if (!expr) return;

    // basit yüzde yakalama
    const num = parseFloat(expr.replace(/[, ]+/g, " ").match(/(\d+(\.\d+)?)/)?.[0] || "NaN");
    const percMatch = expr.match(/%?\s*(\d+(\.\d+)?)\s*%/);
    if (/kdv/i.test(expr)) {
      const perc = percMatch ? parseFloat(percMatch[1]) : 20;
      if (Number.isFinite(num)) {
        const res = num * (1 + perc / 100);
        console.log(ok(`${num} + %${perc} KDV = ${res.toFixed(2)}`));
        return;
      }
    }
    if (percMatch && Number.isFinite(num)) {
      const perc = parseFloat(percMatch[1]);
      const res = (num * perc) / 100;
      console.log(ok(`%${perc} of ${num} = ${res}`));
      return;
    }
    console.log(warn("Basit yüzde/KDV örnekleri desteklenir. İfadeyi sadeleştir."));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 14) Döviz işlemleri (exchangerate.host) — 60 sn disk cache
  async function forexMenu() {
    const cacheFile = path.join(CACHE_DIR, "fx-usd-base.json");

    // Cache yükle
    let fx = null;
    if (await fs.pathExists(cacheFile)) {
      const stat = await fs.stat(cacheFile);
      if (Date.now() - stat.mtimeMs < 60 * 1000) {
        try { fx = await fs.readJson(cacheFile); } catch {}
      }
    }
    // Güncelle
    if (!fx) {
      try {
        fx = JSON.parse(
          await curl(`https://api.exchangerate.host/latest?base=USD`, { Accept: "application/json" }, 20)
        );
        await fs.writeJson(cacheFile, fx);
      } catch (e) {
        console.log(err("Kur verisi alınamadı: " + e.message));
        return;
      }
    }
    const rates = fx.rates || {};

    const { question } = await inquirer.prompt([
      { type: "input", name: "question", message: "Soru (örn: 200 USD kaç TRY? / 500 TRY kaç USD?):" }
    ]);
    if (!question) return;

    const m = question.match(/(\d+(?:\.\d+)?)\s*([A-Za-z]{3}).*?([A-Za-z]{3})/);
    if (!m) {
      console.log(err("Çözümlenemedi. Örn: 200 USD kaç TRY?"));
      return;
    }
    const amount = parseFloat(m[1]);
    const from = m[2].toUpperCase();
    const to = m[3].toUpperCase();

    function toUSD(x, code) {
      if (code === "USD") return x;
      const r = rates[code];
      if (!r) return NaN;
      return x / r;
    }
    function fromUSD(x, code) {
      if (code === "USD") return x;
      const r = rates[code];
      if (!r) return NaN;
      return x * r;
    }

    const inUSD = toUSD(amount, from);
    if (!Number.isFinite(inUSD)) {
      console.log(err(`Desteklenmeyen para birimi: ${from}`));
      return;
    }
    const out = fromUSD(inUSD, to);
    if (!Number.isFinite(out)) {
      console.log(err(`Desteklenmeyen para birimi: ${to}`));
      return;
    }
    console.log(ok(`${amount} ${from} ≈ ${out.toFixed(2)} ${to}`));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Dışa verilecek API
  return {
    rollSingleDie,
    rollDoubleDice,
    coinFlip,
    randomNumberMenu,
    rockPaperScissors,
    englishDictionary,
    multiLangDictionary,
    stopwatchMenu,
    podcastSearchMenu,
    youtubeSearchMenu,
    sportsResultsMenu,
    musicSearchMenu,
    moneyCalcMenu,
    forexMenu
  };
}
