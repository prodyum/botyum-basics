// Description: Implements the wiki qa features.

import { encodeQuery } from "../utils.js";

export function createWikiQaGroup(ctx) {
  const { inquirer, ok, err, dim, title, printDivider, curl } = ctx;

  async function fetchSummary(question) {
    const trimmed = (question || "")
      .trim()
      .replace(/(nedir|niçindir|kimdir|nasıldır|nerededir|ne zaman olmuştur|\?|\.|,)/gi, "")
      .trim();
    async function summary(lang, term) {
      const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeQuery(term)}`;
      try {
        const response = await curl(url, { Accept: "application/json" });
        return JSON.parse(response);
      } catch {
        return null;
      }
    }
    let data = await summary("tr", trimmed);
    if (!data || data.type?.includes("errors/not_found")) {
      data = await summary("en", trimmed);
    }
    return data;
  }

  async function askWikipedia() {
    const { question } = await inquirer.prompt([
      { type: "input", name: "question", message: "Soru" },
    ]);
    if (!question) return;
    const data = await fetchSummary(question);
    if (!data) {
      console.log(err("Özet alınamadı."));
      return;
    }
    printDivider();
    console.log(title(data.title || question));
    if (data.extract) {
      console.log(data.extract);
    }
    if (data.content_urls?.desktop?.page) {
      console.log(dim(`Kaynak: ${data.content_urls.desktop.page}`));
    }
    printDivider();
  }

  return {
    id: "web-wiki-qa",
    label: "Wikipedia soru-cevap",
    description: "Kısa özetleri Wikipedia'dan çeker.",
    items: [{ id: "web-wiki-qa-run", label: "Soru sor", run: askWikipedia }],
  };
}


