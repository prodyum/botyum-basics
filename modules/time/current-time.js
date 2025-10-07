// Description: Implements the current time features.

import { countryToTimezones } from "../core/utils.js";

export function createCurrentTimeGroup(ctx) {
  const { inquirer, ok, err, title, dim, printDivider, DateTime, ct, getCountryCode } = ctx;

  async function showCurrentTime() {
    const { country } = await inquirer.prompt([
      { type: "input", name: "country", message: "Ülke adı veya ISO kodu (örn: Türkiye / TR)" },
    ]);
    const zones = countryToTimezones(country, ct, getCountryCode);
    if (!zones.length) {
      console.log(err("Geçerli bir ülke/saat dilimi bulunamadı."));
      return;
    }
    printDivider();
    zones.forEach((zone) => {
      const now = DateTime.now().setZone(zone);
      console.log(`${ok(zone)} → ${now.toFormat("yyyy-MM-dd HH:mm:ss ZZZZ")} (${now.weekdayLong})`);
    });
    printDivider();
  }

  return {
    id: "time-current",
    label: "Ülkeye göre şu an",
    description: "Seçilen ülkenin saat dilimlerini listeler.",
    items: [{ id: "time-current-run", label: "Zamanı göster", run: showCurrentTime }],
  };
}


