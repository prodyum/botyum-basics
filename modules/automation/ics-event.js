// Description: Implements the ics event features.

import crypto from "crypto";
import fs from "fs-extra";
import path from "path";
import { DateTime } from "luxon";

import { ensureDir } from "./utils.js";

export function createIcsEventGroup(ctx) {
  const { inquirer, ok, err, title, printDivider } = ctx;

  function escapeICS(value) {
    return String(value)
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  async function createEvent() {
    const answers = await inquirer.prompt([
      { type: "input", name: "summary", message: "Başlık" },
      { type: "input", name: "start", message: "Başlangıç (ISO, ör: 2025-12-01T14:00)" },
      { type: "number", name: "duration", message: "Süre (dakika)", default: 60 },
      { type: "input", name: "location", message: "Yer (opsiyonel)", default: "" },
      { type: "editor", name: "description", message: "Açıklama (opsiyonel)" },
    ]);
    const start = DateTime.fromISO(answers.start, { setZone: true });
    if (!start.isValid) {
      console.log(err("Geçersiz başlangıç."));
      return;
    }
    const end = start.plus({ minutes: answers.duration || 60 });
    const uid = `${crypto.randomUUID()}@botyum`;
    const format = (dt) => dt.toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//botyum-basics//automation//TR",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${format(DateTime.utc())}`,
      `DTSTART:${format(start)}`,
      `DTEND:${format(end)}`,
      `SUMMARY:${escapeICS(answers.summary || "")}`,
    ];
    if (answers.location) {
      lines.push(`LOCATION:${escapeICS(answers.location)}`);
    }
    if (answers.description) {
      lines.push(`DESCRIPTION:${escapeICS(answers.description)}`);
    }
    lines.push("END:VEVENT", "END:VCALENDAR");
    const eventsDir = ensureDir("events");
    const outPath = path.join(eventsDir, `event-${Date.now()}.ics`);
    await fs.writeFile(outPath, lines.join("\r\n"), "utf8");
    console.log(ok(`Oluşturuldu: ${outPath}`));
    printDivider();
  }

  return {
    id: "ics-event",
    label: "ICS etkinlik oluşturucu",
    description: "Kısa sürede iCalendar dosyası üretir.",
    items: [{ id: "ics-event-create", label: "Etkinlik oluştur", run: createEvent }],
  };
}


