// Description: Implements the natural reminders features.

import { DateTime } from "luxon";
import { parseFlexibleDateTime } from "../core/utils.js";

export function createNaturalRemindersGroup(ctx) {
  const { inquirer, ok, readStore, writeStore, scheduleAbsolute } = ctx;

  async function createReminder() {
    const { text } = await inquirer.prompt([
      { type: "input", name: "text", message: "Hatırlatma cümlesi:" },
    ]);
    if (!text) {
      return;
    }
    // Basit doğal dil/biçim yakalama: cümlede tarih/saat yoksa kullanıcıdan iste
    const quickMatch = text.match(/(\d{1,2}:\d{2}|\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{2,4}(?:\s+\d{1,2}:\d{2})?)/);
    let whenDT = quickMatch ? parseFlexibleDateTime(quickMatch[1]) : DateTime.invalid("no-datetime");
    if (!whenDT.isValid) {
      const { whenInput } = await inquirer.prompt([
        { type: "input", name: "whenInput", message: "Ne zaman? (örn: 15:30 veya 01.12.2025 09:00)", default: "15:00" },
      ]);
      const parsed = parseFlexibleDateTime(whenInput);
      whenDT = parsed.isValid ? parsed : DateTime.now().plus({ minutes: 1 });
    }
    const whenISO = whenDT.toISO();
    const store = await readStore();
    store.alarms ||= [];
    const reminder = { id: `n-${Date.now()}`, type: "natural", message: text, when: whenISO };
    store.alarms.push(reminder);
    await writeStore(store);
    await scheduleAbsolute(whenISO, text);
    console.log(ok(`Hatırlatma kaydedildi (${reminder.id}).`));
  }

  return {
    id: "natural-reminders",
    label: "Doğal dil hatırlatmalar",
    description: "Kısa cümlelerden hızlı hatırlatmalar oluşturur.",
    items: [{ id: "natural-reminders-create", label: "Hatırlatma ekle", run: createReminder }],
  };
}


