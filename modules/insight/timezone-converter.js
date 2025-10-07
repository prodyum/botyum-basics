// Description: Implements the timezone converter features.

import { DateTime } from "luxon";
import { parseFlexibleDateTime } from "../core/utils.js";

export function createTimezoneConverterGroup(ctx) {
  const { inquirer, ok, err } = ctx;

  async function convertTime() {
    const answers = await inquirer.prompt([
      { type: "input", name: "sourceZone", message: "Kaynak zaman dilimi (örn: Europe/Istanbul)", default: "UTC" },
      { type: "input", name: "time", message: "Zaman (örn: 12.10.2025 09:00 ya da 14:30)" },
      { type: "input", name: "targetZone", message: "Hedef zaman dilimi (örn: UTC)", default: "UTC" },
    ]);
    const base = answers.time || DateTime.now().toISO();
    const dt = parseFlexibleDateTime(base, { zone: answers.sourceZone, now: DateTime.now().setZone(answers.sourceZone) });
    if (!dt.isValid) {
      console.log(err("Geçersiz zaman girdisi."));
      return;
    }
    const converted = dt.setZone(answers.targetZone);
    console.log(ok(`${dt.toFormat("yyyy-MM-dd HH:mm:ss ZZZZ")} → ${converted.toFormat("yyyy-MM-dd HH:mm:ss ZZZZ")}`));
  }

  return {
    id: "timezone-converter",
    label: "Saat dilimi dönüştürücü",
    description: "Zamanı başka bir dilime çevirir.",
    items: [{ id: "timezone-converter-run", label: "Zamanı çevir", run: convertTime }],
  };
}


