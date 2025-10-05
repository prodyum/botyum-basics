// Description: Implements the alarm inventory features.

import Table from "cli-table3";

export function createAlarmInventoryGroup(ctx) {
  const { inquirer, ok, warn, err, DateTime, readStore, writeStore } = ctx;

  async function manageAlarms() {
    const store = await readStore();
    const alarms = store.alarms || [];
    if (!alarms.length) {
      console.log(warn("Kayıtlı alarm bulunmuyor."));
      return;
    }
    const table = new Table({ head: ["ID", "Tür", "Zaman", "Mesaj"] });
    alarms.forEach((alarm) => {
      table.push([
        alarm.id,
        alarm.type,
        DateTime.fromISO(alarm.when).toFormat("yyyy-MM-dd HH:mm:ss"),
        alarm.message,
      ]);
    });
    console.log(table.toString());
    const { action } = await inquirer.prompt([
      { type: "list", name: "action", message: "İşlem", choices: ["Sil", "İptal"] },
    ]);
    if (action === "İptal") return;
    const { id } = await inquirer.prompt([
      { type: "input", name: "id", message: "Silinecek alarm ID" },
    ]);
    const index = alarms.findIndex((alarm) => alarm.id === id);
    if (index < 0) {
      console.log(err("ID bulunamadı."));
      return;
    }
    alarms.splice(index, 1);
    store.alarms = alarms;
    await writeStore(store);
    console.log(ok("Alarm silindi."));
  }

  return {
    id: "scheduler-inventory",
    label: "Alarm kayıtları",
    description: "Mevcut alarm ve geri sayımları listeler.",
    items: [{ id: "scheduler-inventory-run", label: "Kayıtları yönet", run: manageAlarms }],
  };
}


