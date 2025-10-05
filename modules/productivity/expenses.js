// Description: Implements the expenses features.

import { DateTime } from "luxon";

export function createExpensesGroup(ctx) {
  const { inquirer, ok, err, title, dim, printDivider, readStore, writeStore } = ctx;

  async function manageExpenses() {
    const store = await readStore();
    store.expenses ||= [];
    const { action } = await inquirer.prompt([
      { type: "list", name: "action", message: "Harcama takibi", choices: ["Ekle", "Listele", "Sil", "Geri"] },
    ]);
    if (action === "Geri") return;
    if (action === "Ekle") {
      const answers = await inquirer.prompt([
        { type: "input", name: "title", message: "Açıklama:" },
        { type: "number", name: "amount", message: "Tutar:" },
      ]);
      store.expenses.push({ title: answers.title, amount: answers.amount, ts: DateTime.now().toISO() });
      await writeStore(store);
      console.log(ok("Harcama kaydedildi."));
      return;
    }
    if (action === "Listele") {
      if (!store.expenses.length) {
        console.log(dim("Harcama kaydı bulunamadı."));
        return;
      }
      console.log(title("Harcamalar"));
      store.expenses.forEach((item, index) => {
        console.log(`${ok(index + 1)}) ${item.title}: ${item.amount} | ${dim(item.ts)}`);
      });
      printDivider();
      return;
    }
    if (action === "Sil") {
      const { idx } = await inquirer.prompt([{ type: "number", name: "idx", message: "Silinecek numara" }]);
      const index = Number(idx) - 1;
      if (Number.isNaN(index) || index < 0 || index >= store.expenses.length) {
        console.log(err("Geçerli bir numara girin."));
        return;
      }
      store.expenses.splice(index, 1);
      await writeStore(store);
      console.log(ok("Harcama silindi."));
    }
  }

  return {
    id: "expenses",
    label: "Harcama takibi",
    description: "Basit gider kayıtlarını yönetir.",
    items: [{ id: "expenses-manage", label: "Harcamaları yönet", run: manageExpenses }],
  };
}


