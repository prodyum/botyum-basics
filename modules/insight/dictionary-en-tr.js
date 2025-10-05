// Description: Implements the dictionary en tr features.

export function createDictionaryEnTrGroup(ctx) {
  const { inquirer, ok, err, curl } = ctx;

  async function lookupWord() {
    const { word } = await inquirer.prompt([{ type: "input", name: "word", message: "Kelime (EN):" }]);
    if (!word) {
      return;
    }
    try {
      const api = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
      const response = await curl(api, { Accept: "application/json" }, 15);
      const json = JSON.parse(response);
      const entry = json?.[0]?.meanings || [];
      if (!entry.length) {
        console.log(err("Anlam bulunamadı."));
        return;
      }
      entry.slice(0, 3).forEach((meaning) => {
        console.log(ok(meaning.partOfSpeech));
        (meaning.definitions || []).slice(0, 3).forEach((definition) => {
          console.log(` - ${definition.definition}`);
        });
      });
    } catch (error) {
      console.log(err(`Sözlük hatası: ${error.message}`));
    }
  }

  return {
    id: "dictionary-en-tr",
    label: "Sözlük EN→TR",
    description: "English dictionary entries ve anlamlar.",
    items: [{ id: "dictionary-en-tr-run", label: "Kelime ara", run: lookupWord }],
  };
}


