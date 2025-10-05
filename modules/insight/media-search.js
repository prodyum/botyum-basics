// Description: Implements the media search features.

import { parseDuckDuckGo } from "./utils.js";

export function createMediaSearchGroup(ctx) {
  const { inquirer, ok, dim, err, curl } = ctx;

  async function searchMedia() {
    const { term } = await inquirer.prompt([{ type: "input", name: "term", message: "Video / medya araması" }]);
    if (!term) {
      return;
    }
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:youtube.com ${term}`)}`;
      const html = await curl(url, { Accept: "text/html" }, 15);
      const results = parseDuckDuckGo(html, "youtube.com", 10);
      if (!results.length) {
        console.log(err("Sonuç bulunamadı."));
        return;
      }
      results.forEach((result, index) => {
        console.log(`${ok(String(index + 1).padStart(2, "0"))}) ${result.title}`);
        console.log(dim(`   ${result.url}`));
      });
    } catch (error) {
      console.log(err(`Medya araması hatası: ${error.message}`));
    }
  }

  return {
    id: "media-search",
    label: "YouTube araması",
    description: "DuckDuckGo üzerinden hızlı YouTube araması.",
    items: [{ id: "media-search-run", label: "Video ara", run: searchMedia }],
  };
}


