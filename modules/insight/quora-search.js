// modules/insight/quora-search.js
// Searches Quora discussions via DuckDuckGo.


export function createQuoraSearchGroup(ctx) {
  const { inquirer, ok, warn, err, dim, title, printDivider, curl } = ctx;

  function parseDDG(html) {
    const results = [];
    const regex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gsi;
    let match;
    let index = 1;
    while ((match = regex.exec(html)) !== null) {
      const url = match[1];
      const text = match[2].replace(/<[^>]+>/g, "").trim();
      if (url && text) {
        results.push({ i: index++, url, title: text });
      }
      if (results.length >= 20) break;
    }
    return results;
  }

  async function searchQuora() {
    const { query } = await inquirer.prompt([
      { type: "input", name: "query", message: "Anahtar kelime" },
    ]);
    if (!query) return;
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:quora.com ${query}`)}`;
      const html = await curl(url, { Accept: "text/html" }, 20);
      const results = parseDDG(html);
      if (!results.length) {
        console.log(warn("Sonuç yok."));
        return;
      }
      console.log(title("Quora Sonuçları"));
      results.slice(0, 10).forEach((item, index) => {
        console.log(`${ok(String(index + 1).padStart(2, "0"))}) ${item.title}`);
        console.log(dim(`   ${item.url}`));
      });
      printDivider();
      const { index } = await inquirer.prompt([
        { type: "number", name: "index", message: "Özetlenecek # (boş: geç)", default: 0 },
      ]);
      if (index > 0) {
        const pick = results[index - 1];
        if (!pick) return;
        const page = await curl(pick.url, { Accept: "text/html" }, 20);
        const text = page.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
        console.log(title("Sayfa Özeti (ilk 2000):"));
        console.log(text.slice(0, 2000));
      }
    } catch (error) {
      console.log(err(`Arama hatası: ${error.message}`));
    }
  }

  return {
    id: "quora-search",
    label: "Quora araması",
    description: "DuckDuckGo üzerinden Quora sonuçları ve kısa özet.",
    items: [{ id: "quora-search-run", label: "Quora ara", run: searchQuora }],
  };
}



