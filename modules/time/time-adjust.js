// Description: Implements the time adjust features.

import { parseFlexibleDateTime } from "../core/utils.js";

export function createTimeAdjustGroup(ctx) {
  const { inquirer, ok, err, DateTime, Duration } = ctx;

  async function adjustTime() {
    const answers = await inquirer.prompt([
      { type: "input", name: "base", message: "Taban (boş: şimdi) (örn: 12.10.2025 09:00)" },
      { type: "list", name: "operation", message: "İşlem", choices: ["Ekle", "Çıkar"] },
      { type: "number", name: "years", message: "Yıl", default: 0 },
      { type: "number", name: "months", message: "Ay", default: 0 },
      { type: "number", name: "days", message: "Gün", default: 0 },
      { type: "number", name: "hours", message: "Saat", default: 0 },
      { type: "number", name: "minutes", message: "Dakika", default: 0 },
      { type: "number", name: "seconds", message: "Saniye", default: 0 },
    ]);
    let dt = answers.base ? parseFlexibleDateTime(answers.base) : DateTime.now();
    if (!dt.isValid) {
      console.log(err("Geçersiz taban tarih."));
      return;
    }
    const delta = Duration.fromObject({
      years: answers.years,
      months: answers.months,
      days: answers.days,
      hours: answers.hours,
      minutes: answers.minutes,
      seconds: answers.seconds,
    });
    dt = answers.operation === "Ekle" ? dt.plus(delta) : dt.minus(delta);
    console.log(ok(dt.toISO()));
  }

  return {
    id: "time-adjust",
    label: "Tarih ayarlama",
    description: "Girilen süreyi ekler veya çıkarır.",
    items: [{ id: "time-adjust-run", label: "Zamanı ayarla", run: adjustTime }],
  };
}


