// Description: Implements the translation tr en features.

export function createTranslationTrEnGroup(ctx) {
  const { inquirer, ok, err, readStore, curl } = ctx;

  async function translatePhrase() {
    const { text } = await inquirer.prompt([{ type: "input", name: "text", message: "Metin (TR):" }]);
    if (!text) {
      return;
    }
    const store = await readStore();
    const endpoint = store.settings?.libretranslate_url || "https://libretranslate.de";
    try {
      const body = JSON.stringify({ q: text, source: "tr", target: "en", format: "text" });
      const response = await curl(
        `${endpoint}/translate`,
        { "Content-Type": "application/json", Accept: "application/json" },
        15,
        "POST",
        body,
      );
      const json = JSON.parse(response);
      console.log(ok(json.translatedText || "Çeviri alınamadı."));
    } catch (error) {
      console.log(err(`Çeviri hatası: ${error.message}`));
    }
  }

  return {
    id: "translation-tr-en",
    label: "Çeviri TR→EN",
    description: "LibreTranslate üzerinden Türkçe→İngilizce çeviri yapar.",
    items: [{ id: "translation-tr-en-run", label: "Metni çevir", run: translatePhrase }],
  };
}


