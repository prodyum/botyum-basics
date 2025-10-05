// Description: Implements the rss news features.

export function createRssNewsGroup(ctx) {
  const { inquirer, ok, err, title, printDivider, curl } = ctx;

  async function showHeadlines() {
    const { url } = await inquirer.prompt([{ type: "input", name: "url", message: "RSS / Atom URL" }]);
    if (!url) {
      console.log(err("Bir URL girin."));
      return;
    }
    try {
      const xml = await curl(url, { Accept: "application/xml" }, 15);
      const { XMLParser } = await import("fast-xml-parser");
      const parser = new XMLParser();
      const json = parser.parse(xml);
      const items = json?.rss?.channel?.item || json?.feed?.entry || [];
      if (!items.length) {
        console.log(err("Besleme öğesi bulunamadı."));
        return;
      }
      console.log(title("Haber Başlıkları"));
      items.slice(0, 10).forEach((item, index) => {
        const headline = item.title || item["title"]["#text"] || item.summary || "(Başlık yok)";
        console.log(`${ok(index + 1)}) ${headline}`);
      });
      printDivider();
    } catch (error) {
      console.log(err(`RSS okunamadı: ${error.message}`));
    }
  }

  return {
    id: "rss-news",
    label: "Haber akışı",
    description: "RSS/Atom akışlarından başlıkları döker.",
    items: [{ id: "rss-news-run", label: "Haberleri getir", run: showHeadlines }],
  };
}


