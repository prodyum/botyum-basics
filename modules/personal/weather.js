// Description: Implements the weather features.

import { encodeQuery } from "../core/utils.js";

export function createWeatherGroup(ctx) {
  const { inquirer, ok, err, title, dim, printDivider, curl, Table } = ctx;

  async function showWeather() {
    const { place } = await inquirer.prompt([{ type: "input", name: "place", message: "Sehir / konum:" }]);
    if (!place) {
      console.log(err("Bir konum gir."));
      return;
    }
    try {
      const geoJson = JSON.parse(
        await curl(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeQuery(place)}&count=1&language=tr&format=json`,
          { Accept: "application/json" },
          15,
        ),
      );
      if (!geoJson.results?.length) {
        console.log(err("Konum bulunamadi."));
        return;
      }
      const loc = geoJson.results[0];
      const { latitude: lat, longitude: lon, timezone: tz } = loc;
      const weatherJson = JSON.parse(
        await curl(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&hourly=temperature_2m,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=${encodeQuery(tz)}&forecast_days=7`,
          { Accept: "application/json" },
          15,
        ),
      );
      console.log(title(`${loc.name}, ${loc.country_code} (${lat.toFixed(2)}, ${lon.toFixed(2)}) - ${tz}`));
      const table = new Table({ head: ["Tarih", "Kod", "Min", "Max", "Yagis (mm)"] });
      weatherJson.daily.time.forEach((day, index) => {
        table.push([
          day,
          weatherJson.daily.weathercode[index],
          `${weatherJson.daily.temperature_2m_min[index]}°C`,
          `${weatherJson.daily.temperature_2m_max[index]}°C`,
          weatherJson.daily.precipitation_sum[index],
        ]);
      });
      console.log(table.toString());
      if (weatherJson.current) {
        console.log(
          dim(
            `Su an: ${weatherJson.current.temperature_2m}°C, Hissedilen ${weatherJson.current.apparent_temperature}°C, Nem %${weatherJson.current.relative_humidity_2m}, Ruzgar ${weatherJson.current.wind_speed_10m} km/s`,
          ),
        );
      }
      printDivider();
    } catch (error) {
      console.log(err(`Hava durumu cekilemedi: ${error.message}`));
    }
  }

  return {
    id: "personal-weather",
    label: "Hava durumu",
    description: "Open-Meteo ile 7 gunluk tahmin.",
    items: [{ id: "personal-weather-view", label: "Tahmini goster", run: showWeather }],
  };
}


