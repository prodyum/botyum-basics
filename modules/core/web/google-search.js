// Description: Implements the google search features.

import { encodeQuery } from "../utils.js";

function parseGoogleResults(html) {
  const results = [];
  const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gsi;
  let match;
  let index = 1;
  while ((match = h3Regex.exec(html)) !== null) {
    const title = match[1].replace(/<[^>]+>/g, "").trim();
    const snippetStart = Math.max(0, match.index - 3000);
    const snippet = html.slice(snippetStart, match.index + match[0].length + 1000);
    const urlMatch = snippet.match(/\/url\?q=([^"&]+)[^>]*>/i);
    if (title && urlMatch) {
      const candidate = decodeURIComponent(urlMatch[1]);
      if (!candidate.includes("webcache.googleusercontent.com") && !candidate.includes("/search?") && !candidate.startsWith("/")) {
        results.push({ i: index++, title, url: candidate });
      }
    }
    if (results.length >= 10) break;
  }
  return results;
}

function parseDuckDuckGo(html) {
  const results = [];
  const regex = /<a[^>]*class=\"[^\"]*result__a[^\"]*\"[^>]*href=\"([^\"]+)\"[^>]*>(.*?)<\/a>/gsi;
  let match;
  let index = 1;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].replace(/<[^>]+>/g, "").trim();
    if (title && url) {
      results.push({ i: index++, title, url });
    }
    if (results.length >= 10) break;
  }
  return results;
}

export function createGoogleSearchGroup(ctx) {
  const { inquirer, ok, err, warn, dim, title, printDivider, curl } = ctx;

  async function searchWeb() {
    const { query } = await inquirer.prompt([
      { type: "input", name: "query", message: "Arama sorgusu" },
    ]);
    if (!query) return;
    try {
      const encoded = encodeQuery(query);
      const googleHtml = await curl(
        `https://www.google.com/search?q=${encoded}&hl=tr&gl=tr&num=10`,
        {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          Accept: "text/html",
        },
        15,
      );
      let results = parseGoogleResults(googleHtml);
      if (!results.length) {
        const ddgHtml = await curl(`https://html.duckduckgo.com/html/?q=${encoded}`, { Accept: "text/html" }, 15);
        results = parseDuckDuckGo(ddgHtml);
      }
      if (!results.length) {
        console.log(warn("Sonuç bulunamadı."));
        return;
      }
      printDivider();
      console.log(title(`Arama sonuçları (${query}):`));
      results.forEach((item) => {
        console.log(`${ok(String(item.i).padStart(2, "0"))}) ${item.title}`);
        console.log(dim(`   ${item.url}`));
      });
      printDivider();
    } catch (error) {
      console.log(err(`Arama başarısız: ${error.message}`));
    }
  }

  return {
    id: "web-google-search",
    label: "Google araması",
    description: "Google veya DuckDuckGo sonuçlarını listeler.",
    items: [{ id: "web-google-search-run", label: "Arama yap", run: searchWeb }],
  };
}


