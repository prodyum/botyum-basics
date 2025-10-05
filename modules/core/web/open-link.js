// Description: Implements the open link features.

import { sanitizeUrl } from "../utils.js";

export function createOpenLinkGroup(ctx) {
  const { inquirer, ok, open } = ctx;

  async function openInBrowser() {
    const { url } = await inquirer.prompt([
      { type: "input", name: "url", message: "Açılacak URL" },
    ]);
    const formatted = sanitizeUrl(url);
    if (!formatted) {
      console.log("URL gerekli.");
      return;
    }
    await open(formatted);
    console.log(ok(`Açıldı: ${formatted}`));
  }

  return {
    id: "web-open-link",
    label: "Bağlantı aç",
    description: "URL'yi varsayılan tarayıcıda açar.",
    items: [{ id: "web-open-link-run", label: "URL aç", run: openInBrowser }],
  };
}


