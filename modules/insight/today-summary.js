// Description: Implements the today summary features.

import { DateTime } from "luxon";

export function createTodaySummaryGroup(ctx) {
  const { inquirer, ok, err, dim, title, printDivider, curl, readStore } = ctx;

  async function showToday() {
    console.log(title("Bugünüm özeti"));
    try {
      const store = await readStore();
      const today = DateTime.now().toISODate();
      const todays = (store.alarms || []).filter((alarm) => alarm.when?.startsWith?.(today));
      if (todays.length) {
        console.log(dim("Bugünkü hatırlatıcılar:"));
        todays.forEach((alarm, index) => {
          console.log(`${index + 1}) ${alarm.message} @ ${alarm.when}`);
        });
      } else {
        console.log(dim("Bugün için kayıtlı hatırlatıcı yok."));
      }
    } catch {}
    printDivider();
    const { weather } = await inquirer.prompt([
      { type: "confirm", name: "weather", message: "Hava durumu görmek ister misin?", default: false },
    ]);
    if (!weather) {
      return;
    }
    const { place } = await inquirer.prompt([
      { type: "input", name: "place", message: "Şehir / yer adı:" },
    ]);
    if (!place) {
      return;
    }
    try {
      const geoJson = await curl(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=tr&format=json`,
        { Accept: "application/json" },
        15,
      );
      const geo = JSON.parse(geoJson);
      const loc = geo.results && geo.results[0];
      if (!loc) {
        console.log(err("Konum bulunamadı."));
        return;
      }
      const weatherJson = await curl(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m&timezone=${encodeURIComponent(loc.timezone)}`,
        { Accept: "application/json" },
        15,
      );
      const weatherData = JSON.parse(weatherJson);
      console.log(ok(`Şu an: ${weatherData.current.temperature_2m}°C (${loc.name}, ${loc.country_code})`));
    } catch (error) {
      console.log(err(`Hava durumu alınamadı: ${error.message}`));
    }
    printDivider();
  }

  return {
    id: "today-summary",
    label: "Bugüne bakış",
    description: "Günün hatırlatıcıları ve isteğe bağlı hava durumu",
    items: [{ id: "today-summary-run", label: "Bugünü özetle", run: showToday }],
  };
}


