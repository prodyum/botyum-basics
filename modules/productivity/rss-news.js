// Description: Implements the rss news features.

export function createRssNewsGroup(ctx) {
  const { inquirer, ok, err, dim, title, printDivider, curl, open } = ctx;

  async function showHeadlines() {
    const { url } = await inquirer.prompt([{ type: "input", name: "url", message: "RSS / Atom URL" }]);
    if (!url) {
      console.log(err("Bir URL girin."));
      return;
    }
    try {
      const xml = await curl(url, { Accept: "application/xml" }, 15);
      const { XMLParser } = await import("fast-xml-parser");
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
      const json = parser.parse(xml);
      const itemsRaw = json?.rss?.channel?.item || json?.feed?.entry || [];
      const items = Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw].filter(Boolean);
      if (!items.length) {
        console.log(err("Besleme öğesi bulunamadı."));
        return;
      }
      console.log(title("Haber Başlıkları"));
      const top = items.slice(0, 10).map((item, index) => {
        const headline = item.title?.["#text"] || item.title || item.summary || "(Başlık yok)";
        const link = item.link?.href || item.link || item["@_href"] || item.guid || "";
        console.log(`${ok(index + 1)}) ${headline}`);
        if (link) console.log(dim(`   ${link}`));
        return { headline, link };
      });
      printDivider();
      const { openIndex } = await inquirer.prompt([
        { type: "input", name: "openIndex", message: "Açmak istediğin haber numarası (boş: geç)" },
      ]);
      const num = Number((openIndex || "").trim());
      if (Number.isInteger(num) && num >= 1 && num <= top.length) {
        const target = top[num - 1]?.link;
        if (target) {
          await open(target);
        } else {
          console.log(dim("Açılacak bağlantı bulunamadı."));
        }
      }
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


