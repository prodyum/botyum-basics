// Description: Implements the translation features.

export function createTranslationGroup(ctx) {
  const { inquirer, ok, err, readStore, curl } = ctx;

  async function translateText() {
    const store = await readStore();
    const url = store.settings?.libretranslate_url || "https://libretranslate.de";
    const answers = await inquirer.prompt([
      { type: "input", name: "text", message: "Cevirilecek metin:" },
      { type: "input", name: "source", message: "Kaynak dil (tr, en, auto):", default: "auto" },
      { type: "input", name: "target", message: "Hedef dil (en, tr vb.):", default: "en" },
    ]);
    if (!answers.text) {
      console.log(err("Bos metin cevrilemez."));
      return;
    }
    try {
      const body = JSON.stringify({ q: answers.text, source: answers.source, target: answers.target, format: "text" });
      const response = await curl(
        `${url}/translate`,
        { "Content-Type": "application/json", Accept: "application/json" },
        20,
        "POST",
        body,
      );
      const result = JSON.parse(response);
      if (result?.translatedText) {
        console.log(ok(result.translatedText));
      } else {
        console.log(err("Ceviri sonucu alinamadi."));
      }
    } catch (error) {
      console.log(err(`Ceviri servisine ulasilamadi: ${error.message}`));
    }
  }

  return {
    id: "personal-translation",
    label: "Metin cevirisi",
    description: "LibreTranslate API uzerinden ceviri yapar.",
    items: [{ id: "personal-translation-run", label: "Metni cevir", run: translateText }],
  };
}


