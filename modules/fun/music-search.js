// modules/fun/music-search.js
// Search Apple Music and Amazon Music results via DuckDuckGo and print/open links.


import { parseDuckDuckGo } from "../shared/web-search-utils.js";

export function createMusicSearchGroup(ctx) {
  const { inquirer, ok, warn, err, dim, printDivider, curl, open } = ctx;

  function unwrapDuckDuckGo(rawUrl) {
    if (!rawUrl) return "";
    let u = rawUrl;
    if (u.startsWith("//")) u = "https:" + u;
    try {
      const parsed = new URL(u);
      const uddg = parsed.searchParams.get("uddg");
      if (uddg) return decodeURIComponent(uddg);
      return u;
    } catch {
      return rawUrl;
    }
  }

  async function searchMusic() {
    const { term } = await inquirer.prompt([{ type: "input", name: "term", message: "Müzik araması (şarkı/album/sanatçı)" }]);
    if (!term) return;
    try {
      // 1) Genel arama ve filtreleme (music.apple.com | music.amazon.*)
      const generalUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(term)}`;
      const htmlGeneral = await curl(generalUrl, { Accept: "text/html" }, 20);
      const all = parseDuckDuckGo(htmlGeneral, null, 30);
      const appleFromAll = all.filter(r => /(^|\.)music\.apple\.com/i.test(r.url));
      const amazonFromAll = all.filter(r => /(^|\.)music\.amazon\./i.test(r.url) || /amazon\.[^\/]+\/music/i.test(r.url));

      // 2) Site hedefli ek aramalar (daha isabetli sonuçlar için)
      const appleUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${term} site:music.apple.com`)}`;
      const amazonUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${term} site:music.amazon.com`)}`;
      const [htmlApple, htmlAmazon] = await Promise.all([
        curl(appleUrl, { Accept: "text/html" }, 20).catch(() => ""),
        curl(amazonUrl, { Accept: "text/html" }, 20).catch(() => ""),
      ]);
      const appleSite = htmlApple ? parseDuckDuckGo(htmlApple, null, 15) : [];
      const amazonSite = htmlAmazon ? parseDuckDuckGo(htmlAmazon, null, 15) : [];

      const byUrl = new Map();
      function pushUnique(arr) {
        for (const r of arr) {
          const key = r.url;
          if (!key) continue;
          if (!byUrl.has(key)) byUrl.set(key, r);
        }
      }
      pushUnique(appleFromAll);
      pushUnique(appleSite);
      const appleResults = Array.from(byUrl.values());

      byUrl.clear();
      pushUnique(amazonFromAll);
      pushUnique(amazonSite);
      const amazonResults = Array.from(byUrl.values());

      if (!appleResults.length && !amazonResults.length) {
        console.log(warn("Apple/Amazon Music için sonuç bulunamadı."));
        return;
      }

      if (appleResults.length) {
        console.log(ok("Apple Music"));
        appleResults.slice(0, 10).forEach((r, i) => {
          console.log(`${ok(String(i + 1).padStart(2, "0"))}) ${r.title}`);
          console.log(dim(`   ${unwrapDuckDuckGo(r.url)}`));
        });
        printDivider();
      }
      if (amazonResults.length) {
        console.log(ok("Amazon Music"));
        amazonResults.slice(0, 10).forEach((r, i) => {
          console.log(`${ok(String(i + 1).padStart(2, "0"))}) ${r.title}`);
          console.log(dim(`   ${unwrapDuckDuckGo(r.url)}`));
        });
        printDivider();
      }

      // İsteğe bağlı: Bir sonucu tarayıcıda aç
      const { wantOpen } = await inquirer.prompt([
        { type: "confirm", name: "wantOpen", message: "Bir sonucu tarayıcıda açmak ister misiniz?", default: false },
      ]);
      if (wantOpen) {
        const appleList = appleResults.slice(0, 10);
        const amazonList = amazonResults.slice(0, 10);
        const choices = [];
        appleList.forEach((r, i) => choices.push({ name: `Apple #${i + 1}: ${r.title}`, value: unwrapDuckDuckGo(r.url) }));
        amazonList.forEach((r, i) => choices.push({ name: `Amazon #${i + 1}: ${r.title}`, value: unwrapDuckDuckGo(r.url) }));
        if (!choices.length) {
          console.log(warn("Açılacak sonuç yok."));
          return;
        }
        const { targetUrl } = await inquirer.prompt([
          { type: "list", name: "targetUrl", message: "Açılacak bağlantı", choices },
        ]);
        if (targetUrl) {
          await open(targetUrl);
          console.log(dim("Açıldı."));
        }
      }
    } catch (error) {
      console.log(err(`Müzik araması hatası: ${error.message}`));
    }
  }

  return {
    id: "music-search",
    label: "Müzik araması (Apple/Amazon)",
    description: "Sadece Apple Music ve Amazon Music bağlantılarını listeler.",
    items: [{ id: "music-search-run", label: "Müzik ara", run: searchMusic }],
  };
}



