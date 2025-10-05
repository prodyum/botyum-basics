// Description: Implements the sun moon features.

import Table from "cli-table3";
import { DateTime } from "luxon";

export function createSunMoonGroup(ctx) {
  const { inquirer, ok, err, dim, title, printDivider, curl } = ctx;

  function moonPhase(dt) {
    const lunarPeriod = 2551443;
    const now = dt.toSeconds();
    const reference = Date.UTC(1970, 0, 7, 20, 35, 0) / 1000;
    const phase = ((now - reference) % lunarPeriod + lunarPeriod) % lunarPeriod;
    const progress = phase / lunarPeriod;
    const illum = Math.round((1 - Math.cos(2 * Math.PI * progress)) * 50);
    const names = [
      "Yeni Ay",
      "Hilal",
      "İlk Dördün",
      "Büyüyen Ay",
      "Dolunay",
      "Küçülen Büyüyen",
      "Son Dördün",
      "Sönen Hilal",
    ];
    const index = Math.floor(progress * names.length) % names.length;
    return { name: names[index], illum };
  }

  async function showSunMoon() {
    const { place } = await inquirer.prompt([
      { type: "input", name: "place", message: "Şehir/yer", default: "Ankara" },
    ]);
    if (!place) return;
    try {
      const geoJson = await curl(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=tr&format=json`,
        { Accept: "application/json" },
        15,
      );
      const geo = JSON.parse(geoJson);
      if (!geo.results?.length) {
        console.log(err("Konum bulunamadı."));
        return;
      }
      const loc = geo.results[0];
      const sunriseJson = await curl(
        `https://api.sunrise-sunset.org/json?lat=${loc.latitude}&lng=${loc.longitude}&formatted=0`,
        { Accept: "application/json" },
        15,
      );
      const events = JSON.parse(sunriseJson).results;
      const table = new Table({ head: ["Olay", "Zaman (yerel)"] });
      const toLocal = (iso) => DateTime.fromISO(iso).setZone(loc.timezone).toFormat("yyyy-MM-dd HH:mm");
      table.push(
        ["Güneş Doğumu", toLocal(events.sunrise)],
        ["Güneş Batımı", toLocal(events.sunset)],
        ["Alacakaranlık (sabah)", toLocal(events.civil_twilight_begin)],
        ["Alacakaranlık (akşam)", toLocal(events.civil_twilight_end)],
      );
      console.log(title(`${loc.name} - Güneş olayları`));
      console.log(table.toString());
      const phase = moonPhase(DateTime.now());
      console.log(dim(`Ay evresi: ${phase.name} · Aydınlık: %${phase.illum}`));
      printDivider();
    } catch (error) {
      console.log(err(`Bilgi alınamadı: ${error.message}`));
    }
  }

  return {
    id: "sun-moon",
    label: "Güneş/Ay bilgisi",
    description: "Güneş doğumu/batımı ve ay evresini listeler.",
    items: [{ id: "sun-moon-run", label: "Güneş/Ay bilgisi", run: showSunMoon }],
  };
}


