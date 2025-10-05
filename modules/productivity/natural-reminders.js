// Description: Implements the natural reminders features.

import { DateTime } from "luxon";

export function createNaturalRemindersGroup(ctx) {
  const { inquirer, ok, readStore, writeStore, scheduleAbsolute } = ctx;

  async function createReminder() {
    const { text } = await inquirer.prompt([
      { type: "input", name: "text", message: "Hatırlatma cümlesi:" },
    ]);
    if (!text) {
      return;
    }
    const store = await readStore();
    store.alarms ||= [];
    const when = DateTime.now().plus({ minutes: 1 }).toISO();
    const reminder = { id: `n-${Date.now()}`, type: "natural", message: text, when };
    store.alarms.push(reminder);
    await writeStore(store);
    await scheduleAbsolute(when, text);
    console.log(ok(`Hatırlatma kaydedildi (${reminder.id}).`));
  }

  return {
    id: "natural-reminders",
    label: "Doğal dil hatırlatmalar",
    description: "Kısa cümlelerden hızlı hatırlatmalar oluşturur.",
    items: [{ id: "natural-reminders-create", label: "Hatırlatma ekle", run: createReminder }],
  };
}


