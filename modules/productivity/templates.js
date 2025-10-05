// Description: Implements the templates features.

export function createTemplatesGroup(ctx) {
  const { inquirer, ok, err, title, dim, printDivider, readStore, writeStore } = ctx;

  async function manageTemplates() {
    const store = await readStore();
    store.templates ||= {};
    const { action } = await inquirer.prompt([
      { type: "list", name: "action", message: "Şablonlar", choices: ["Ekle", "Listele", "Sil", "Kullan", "Geri"] },
    ]);
    if (action === "Geri") return;
    if (action === "Ekle") {
      const answers = await inquirer.prompt([
        { type: "input", name: "key", message: "Şablon adı" },
        { type: "editor", name: "body", message: "İçerik" },
      ]);
      store.templates[answers.key] = answers.body;
      await writeStore(store);
      console.log(ok("Şablon kaydedildi."));
      return;
    }
    if (action === "Listele") {
      const keys = Object.keys(store.templates);
      if (!keys.length) {
        console.log(dim("Şablon bulunmuyor."));
        return;
      }
      console.log(title("Şablonlar"));
      keys.forEach((key) => {
        console.log(`${ok(key)} → ${store.templates[key].split("\n")[0].slice(0, 50)}...`);
      });
      printDivider();
      return;
    }
    if (action === "Sil") {
      const { key } = await inquirer.prompt([{ type: "input", name: "key", message: "Silinecek şablon" }]);
      if (store.templates[key]) {
        delete store.templates[key];
        await writeStore(store);
        console.log(ok("Silindi."));
      } else {
        console.log(err("Şablon bulunamadı."));
      }
      return;
    }
    if (action === "Kullan") {
      const { key } = await inquirer.prompt([{ type: "input", name: "key", message: "Şablon adı" }]);
      const body = store.templates[key];
      if (!body) {
        console.log(err("Şablon bulunamadı."));
        return;
      }
      console.log(title("Şablon içeriği"));
      console.log(body);
      printDivider();
    }
  }

  return {
    id: "text-templates",
    label: "Mesaj şablonları",
    description: "Sık kullanılan metinleri saklar ve görüntüler.",
    items: [{ id: "text-templates-manage", label: "Şablonları yönet", run: manageTemplates }],
  };
}


