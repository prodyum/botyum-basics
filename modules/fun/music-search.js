// modules/fun/music-search.js
// Search music results via DuckDuckGo.


import { parseDuckDuckGo } from "../shared/web-search-utils.js";

export function createMusicSearchGroup(ctx) {
  const { inquirer, ok, warn, err, dim, printDivider, curl } = ctx;

  async function searchMusic() {
    const { term } = await inquirer.prompt([{ type: "input", name: "term", message: "Müzik araması" }]);
    if (!term) return;
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(term)}`;
      const html = await curl(url, { Accept: "text/html" }, 20);
      const results = parseDuckDuckGo(html, null, 10);
      if (!results.length) {
        console.log(warn("Sonuç bulunamadı."));
        return;
      }
      results.forEach((result, index) => {
        console.log(`${ok(String(index + 1).padStart(2, "0"))}) ${result.title}`);
        console.log(dim(`   ${result.url}`));
      });
      printDivider();
    } catch (error) {
      console.log(err(`Müzik araması hatası: ${error.message}`));
    }
  }

  return {
    id: "music-search",
    label: "Müzik araması",
    description: "Apple/Amazon Music dahil genel sonuçları listeler.",
    items: [{ id: "music-search-run", label: "Müzik ara", run: searchMusic }],
  };
}



