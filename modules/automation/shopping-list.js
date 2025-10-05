// Description: Implements the shopping list features.

import fs from "fs-extra";
import path from "path";
import Table from "cli-table3";
import { DateTime } from "luxon";

import { ensureDir, csvEscape } from "./utils.js";

export function createShoppingListGroup(ctx) {
  const { inquirer, ok, err, dim, title, printDivider, readStore, writeStore } = ctx;

  async function addItem(store) {
    const answers = await inquirer.prompt([
      { type: "input", name: "title", message: "Ürün" },
      { type: "input", name: "category", message: "Kategori (opsiyonel)", default: "" },
      { type: "input", name: "quantity", message: "Miktar (opsiyonel)", default: "" },
    ]);
    store.shopping.push({
      title: answers.title,
      cat: answers.category,
      qty: answers.quantity,
      done: false,
      ts: DateTime.now().toISO(),
    });
    await writeStore(store);
    console.log(ok("Eklendi."));
  }

  function listItems(store) {
    if (!store.shopping.length) {
      console.log(dim("Liste boş."));
      return;
    }
    const table = new Table({ head: ["#", "Ürün", "Kategori", "Miktar", "Durum"] });
    store.shopping.forEach((item, index) => {
      table.push([
        index + 1,
        item.title,
        item.cat || "-",
        item.qty || "-",
        item.done ? ok("✓") : dim("•"),
      ]);
    });
    console.log(title("Alışveriş Listesi"));
    console.log(table.toString());
    printDivider();
  }

  async function toggleItem(store) {
    const { idx } = await inquirer.prompt([{ type: "number", name: "idx", message: "Sıra #" }]);
    const item = store.shopping[idx - 1];
    if (!item) {
      console.log(err("Bulunamadı."));
      return;
    }
    item.done = !item.done;
    await writeStore(store);
    console.log(ok("Durum güncellendi."));
  }

  async function deleteItem(store) {
    const { idx } = await inquirer.prompt([{ type: "number", name: "idx", message: "Silinecek #" }]);
    if (store.shopping[idx - 1]) {
      store.shopping.splice(idx - 1, 1);
      await writeStore(store);
      console.log(ok("Silindi."));
    } else {
      console.log(err("Bulunamadı."));
    }
  }

  async function exportCsv(store) {
    const exportsDir = ensureDir("exports");
    const outPath = path.join(exportsDir, `shopping-${Date.now()}.csv`);
    const lines = [
      "title,qty,cat,done,ts",
      ...store.shopping.map((item) => [
        csvEscape(item.title),
        csvEscape(item.qty),
        csvEscape(item.cat),
        item.done ? "1" : "0",
        item.ts || "",
      ].join(",")),
    ];
    await fs.writeFile(outPath, lines.join("\n"), "utf8");
    console.log(ok(`Dışa aktarıldı: ${outPath}`));
  }

  async function shoppingMenu() {
    const store = await readStore();
    store.shopping ||= [];
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Alışveriş listesi",
        choices: [
          { name: "Ekle", value: "add" },
          { name: "Listele", value: "list" },
          { name: "Tamamla / geri al", value: "toggle" },
          { name: "Sil", value: "delete" },
          { name: "CSV dışa aktar", value: "csv" },
          { name: "Geri", value: "back" },
        ],
      },
    ]);
    if (action === "back") return;
    if (action === "add") {
      await addItem(store);
    } else if (action === "list") {
      listItems(store);
    } else if (action === "toggle") {
      await toggleItem(store);
    } else if (action === "delete") {
      await deleteItem(store);
    } else if (action === "csv") {
      await exportCsv(store);
    }
  }

  return {
    id: "shopping-list",
    label: "Alışveriş listesi",
    description: "Ürün ekleyin, takip edin ve dışa aktarın.",
    items: [{ id: "shopping-list-run", label: "Listeyi yönet", run: shoppingMenu }],
  };
}


