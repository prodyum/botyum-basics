// modules/automation/routines.js
// Rutinler: basit hatırlatma planlama (çalışır) ve diğer kısımlar için geliştirme uyarısı.


import { parseFlexibleDateTime } from "../core/utils.js";

export function createRoutinesGroup(ctx) {
  const { inquirer, ok, err, dim, readStore, writeStore, scheduleAbsolute } = ctx;

  async function planReminder() {
    const answers = await inquirer.prompt([
      { type: "input", name: "message", message: "Hatırlatma mesajı:" },
      { type: "input", name: "whenInput", message: "Ne zaman? (örn: 15:30 veya 01.12.2025 09:00)" },
    ]);
    if (!answers.message) {
      console.log(err("Mesaj gerekli."));
      return;
    }
    const dt = parseFlexibleDateTime(answers.whenInput);
    if (!dt?.isValid) {
      console.log(err("Geçersiz zaman girdisi."));
      return;
    }
    const whenISO = dt.toISO();
    const store = await readStore();
    store.alarms ||= [];
    const id = `r-${Date.now()}`;
    store.alarms.push({ id, type: "routine", message: answers.message, when: whenISO });
    await writeStore(store);
    await scheduleAbsolute(whenISO, answers.message);
    console.log(ok(`Planlandı (#${id})`));
  }

  async function developing(name) {
    console.log(dim(`${name}: henüz geliştirilme aşamasındadır.`));
  }

  return {
    id: "routines",
    label: "Rutinler",
    description: "Hatırlatma planla; diğer kısımlar geliştirilmekte.",
    items: [
      { id: "routines-reminder", label: "Hatırlatma planla", run: planReminder },
      { id: "routines-rule-engine", label: "Kural motoru", run: () => developing("Kural motoru") },
      { id: "routines-actions", label: "Eylemler (TTS/Webhook/Takvim/Uygulama)", run: () => developing("Eylemler") },
    ],
  };
}





