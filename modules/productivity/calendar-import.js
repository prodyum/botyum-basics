// Description: Implements the calendar import features.

import fs from "fs-extra";

export function createCalendarImportGroup(ctx) {
  const { inquirer, ok, err, printDivider, title, curl } = ctx;

  async function importCalendar() {
    const { source } = await inquirer.prompt([
      { type: "input", name: "source", message: "ICS URL veya dosya yolu:" },
    ]);
    if (!source) {
      console.log(err("Bir kaynak belirtin."));
      return;
    }
    try {
      const raw = source.startsWith("http")
        ? await curl(source, { Accept: "application/octet-stream" }, 20)
        : await fs.readFile(source, "utf8");
      const lines = raw.split(/\r?\n/);
      const events = [];
      let current = {};
      for (const line of lines) {
        if (line.startsWith("BEGIN:VEVENT")) current = {};
        else if (line.startsWith("END:VEVENT")) events.push(current);
        else if (line.startsWith("DTSTART")) current.start = line.split(":")[1];
        else if (line.startsWith("DTEND")) current.end = line.split(":")[1];
        else if (line.startsWith("SUMMARY")) current.summary = line.split(":")[1];
      }
      if (!events.length) {
        console.log(err("Takvimde etkinlik bulunamadı."));
        return;
      }
      console.log(title("Takvim Etkinlikleri"));
      events.forEach((event, index) => {
        console.log(`${ok(index + 1)}) ${event.summary} | ${event.start} → ${event.end}`);
      });
      printDivider();
    } catch (error) {
      console.log(err(`Takvim import hatası: ${error.message}`));
    }
  }

  return {
    id: "calendar-import",
    label: "Takvim içe aktarımı",
    description: "ICS kaynaklarından etkinlikleri listeler.",
    items: [{ id: "calendar-import-run", label: "Takvim içe aktar", run: importCalendar }],
  };
}


