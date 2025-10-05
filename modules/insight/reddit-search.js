// modules/insight/reddit-search.js
// Searches Reddit threads via DuckDuckGo.


export function createRedditSearchGroup(ctx) {
  const { inquirer, ok, warn, err, dim, title, curl } = ctx;

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

  async function searchReddit() {
    const { query } = await inquirer.prompt([
      { type: "input", name: "query", message: "Anahtar kelime" },
    ]);
    if (!query) return;
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:reddit.com ${query}`)}`;
      const html = await curl(url, { Accept: "text/html" }, 20);
      const results = parseDDG(html);
      if (!results.length) {
        console.log(warn("Sonuç yok."));
        return;
      }
      console.log(title("Reddit Sonuçları"));
      results.slice(0, 10).forEach((item, index) => {
        console.log(`${ok(String(index + 1).padStart(2, "0"))}) ${item.title}`);
        console.log(dim(`   ${item.url}`));
      });
      const { index } = await inquirer.prompt([
        { type: "number", name: "index", message: "Yorumları çekilecek # (boş: geç)", default: 0 },
      ]);
      if (index > 0) {
        let target = results[index - 1]?.url;
        if (!target) return;
        if (!/\.json$/.test(target)) {
          target = target.replace(/\/?$/, "/.json");
        }
        const json = JSON.parse(await curl(target, { Accept: "application/json" }, 20));
        const comments = (json[1]?.data?.children || [])
          .filter((item) => item.kind === "t1")
          .slice(0, 10);
        comments.forEach((comment, idx) => {
          console.log(`${ok(String(idx + 1).padStart(2, "0"))}) ${comment.data.author}: ${comment.data.body.slice(0, 200)}`);
        });
      }
    } catch (error) {
      console.log(err(`Reddit hatası: ${error.message}`));
    }
  }

  return {
    id: "reddit-search",
    label: "Reddit araması",
    description: "Reddit sonuçlarını listeler ve yorum örnekleri getirir.",
    items: [{ id: "reddit-search-run", label: "Reddit ara", run: searchReddit }],
  };
}



