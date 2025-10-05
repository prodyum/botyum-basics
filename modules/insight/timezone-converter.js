// Description: Implements the timezone converter features.

import { DateTime } from "luxon";

export function createTimezoneConverterGroup(ctx) {
  const { inquirer, ok, err } = ctx;

  async function convertTime() {
    const answers = await inquirer.prompt([
      { type: "input", name: "sourceZone", message: "Kaynak zaman dilimi", default: "UTC" },
      { type: "input", name: "time", message: "Zaman (ISO veya HH:mm)" },
      { type: "input", name: "targetZone", message: "Hedef zaman dilimi", default: "UTC" },
    ]);
    const base = answers.time || DateTime.now().toISO();
    const dt = DateTime.fromISO(base, { zone: answers.sourceZone });
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


