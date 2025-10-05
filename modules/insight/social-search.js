// Description: Implements the social search features.

import { parseDuckDuckGo } from "./utils.js";

export function createSocialSearchGroup(ctx) {
  const { inquirer, ok, dim, err, title, curl, printDivider } = ctx;

  async function searchSocial() {
    const { term } = await inquirer.prompt([{ type: "input", name: "term", message: "Aranacak ifade" }]);
    if (!term) {
      return;
    }
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(term)}`;
      const html = await curl(url, { Accept: "text/html" }, 15);
      const results = parseDuckDuckGo(html, null, 10);
      if (!results.length) {
        console.log(err("Sonuç bulunamadı."));
        return;
      }
      console.log(title("Arama sonuçları"));
      results.forEach((result, index) => {
        console.log(`${ok(String(index + 1).padStart(2, "0"))}) ${result.title}`);
        console.log(dim(`   ${result.url}`));
      });
      printDivider();
    } catch (error) {
      console.log(err(`Arama hatası: ${error.message}`));
    }
  }

  return {
    id: "social-search",
    label: "Genel arama",
    description: "DuckDuckGo sonuçlarından hızlı özet.",
    items: [{ id: "social-search-run", label: "Arama yap", run: searchSocial }],
  };
}


