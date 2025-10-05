// modules/personal/synonyms.js
// Maintains a local synonym dictionary.


export function createSynonymsGroup(ctx) {
  const { inquirer, ok, warn, readStore, writeStore } = ctx;

  async function manageSynonyms() {
    const store = await readStore();
    store.synonyms ||= {};
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Eş anlamlı sözlük",
        choices: [
          { name: "Ekle / güncelle", value: "upsert" },
          { name: "Listele", value: "list" },
          { name: "Sil", value: "delete" },
          { name: "Ara", value: "find" },
          { name: "Geri", value: "back" },
        ],
      },
    ]);
    if (action === "back") return;
    if (action === "upsert") {
      const entry = await inquirer.prompt([
        { type: "input", name: "key", message: "Anahtar" },
        { type: "input", name: "values", message: "Eş anlamlılar (virgüllerle)" },
      ]);
      store.synonyms[entry.key] = entry.values
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      await writeStore(store);
      console.log(ok("Kaydedildi."));
      return;
    }
    if (action === "list") {
      Object.entries(store.synonyms).forEach(([key, values]) => {
        console.log(`${ok(key)}: ${values.join(", ")}`);
      });
      return;
    }
    if (action === "delete") {
      const { key } = await inquirer.prompt([
        { type: "input", name: "key", message: "Silinecek anahtar" },
      ]);
      delete store.synonyms[key];
      await writeStore(store);
      console.log(ok("Silindi."));
      return;
    }
    if (action === "find") {
      const { key } = await inquirer.prompt([
        { type: "input", name: "key", message: "Ara" },
      ]);
      const values = store.synonyms[key];
      console.log(values ? values.join(", ") : warn("Bulunamadı."));
    }
  }

  return {
    id: "synonyms",
    label: "Eş anlamlı sözlük",
    description: "Yerel eş anlamlı çiftlerini saklar.",
    items: [{ id: "synonyms-manage", label: "Sözlüğü yönet", run: manageSynonyms }],
  };
}



