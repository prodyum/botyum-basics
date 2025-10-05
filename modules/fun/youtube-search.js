// modules/fun/youtube-search.js
// List YouTube results using DuckDuckGo HTML.


import { parseDuckDuckGo } from "../shared/web-search-utils.js";

export function createYoutubeSearchGroup(ctx) {
  const { inquirer, ok, warn, err, dim, printDivider, curl } = ctx;

  async function searchYoutube() {
    const { term } = await inquirer.prompt([{ type: "input", name: "term", message: "YouTube araması" }]);
    if (!term) return;
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:youtube.com ${term}`)}`;
      const html = await curl(url, { Accept: "text/html" }, 20);
      const results = parseDuckDuckGo(html, "youtube.com", 10);
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
      console.log(err(`YouTube araması hatası: ${error.message}`));
    }
  }

  return {
    id: "youtube-search",
    label: "YouTube araması",
    description: "DuckDuckGo üzerinden YouTube sonuçlarını listeler.",
    items: [{ id: "youtube-search-run", label: "Video ara", run: searchYoutube }],
  };
}



