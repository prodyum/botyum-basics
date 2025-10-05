// Description: Implements the content summarizer features.

import { htmlToText } from "html-to-text";

export function createContentSummarizerGroup(ctx) {
  const { inquirer, ok, err, title, printDivider, curl } = ctx;

  async function summarizeUrl() {
    const { url } = await inquirer.prompt([{ type: "input", name: "url", message: "Özetlenecek URL" }]);
    if (!url) {
      console.log(err("Bir URL girin."));
      return;
    }
    try {
      const html = await curl(url, { Accept: "text/html" }, 20);
      const text = htmlToText(html, { wordwrap: 120 }) || "";
      console.log(title("Metin özeti (ilk 2000 karakter)"));
      console.log(text.slice(0, 2000));
      printDivider();
    } catch (error) {
      console.log(err(`Özetleme hatası: ${error.message}`));
    }
  }

  return {
    id: "content-summary",
    label: "Metin özetleyici",
    description: "Bir web sayfasının kısa özetini çıkarır.",
    items: [{ id: "content-summary-run", label: "URL özetle", run: summarizeUrl }],
  };
}


