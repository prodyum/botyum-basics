// Description: Implements the fetch content features.

import { sanitizeUrl } from "../utils.js";

export function createFetchContentGroup(ctx) {
  const { inquirer, ok, err, title, printDivider, curl, htmlToText } = ctx;

  async function fetchAndShow() {
    const { url } = await inquirer.prompt([
      { type: "input", name: "url", message: "Çekilecek URL" },
    ]);
    try {
      const html = await curl(sanitizeUrl(url));
      const text = htmlToText(html, {
        wordwrap: 100,
        selectors: [{ selector: "a", options: { ignoreHref: true } }],
      });
      printDivider();
      console.log(title("Sayfa Metni"));
      console.log(text.slice(0, 20000));
      printDivider();
    } catch (error) {
      console.log(err(error.message));
    }
  }

  return {
    id: "web-fetch-content",
    label: "Web içeriği getir",
    description: "Bir sayfanın metnini konsola yazdırır.",
    items: [{ id: "web-fetch-content-run", label: "İçeriği getir", run: fetchAndShow }],
  };
}


