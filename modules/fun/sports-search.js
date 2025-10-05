// modules/fun/sports-search.js
// Fetch sports headlines through DuckDuckGo.


import { parseDuckDuckGo } from "../shared/web-search-utils.js";

export function createSportsSearchGroup(ctx) {
  const { inquirer, ok, warn, err, dim, printDivider, curl } = ctx;

  async function searchSports() {
    const { term } = await inquirer.prompt([{ type: "input", name: "term", message: "Spor / lig" }]);
    if (!term) return;
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${term} sonuçları`)}`;
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
      console.log(err(`Spor araması hatası: ${error.message}`));
    }
  }

  return {
    id: "sports-search",
    label: "Spor sonuçları",
    description: "Lig sonuçlarını web üzerinden hızlıca listeler.",
    items: [{ id: "sports-search-run", label: "Sonuçları getir", run: searchSports }],
  };
}



