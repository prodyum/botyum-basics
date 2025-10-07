// modules/productivity/calendar.js
// Manages local calendar events and reminders.


import Table from "cli-table3";
import { DateTime } from "luxon";
import { parseFlexibleDateTime } from "../core/utils.js";

export function createCalendarGroup(ctx) {
  const { inquirer, ok, err, readStore, writeStore, scheduleAbsolute } = ctx;

  async function manageCalendar() {
    const store = await readStore();
    store.events ||= [];
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Takvim",
        choices: ["Oluştur", "Listele", "Düzenle", "Sil", "Hatırlat ayarla", "Geri"],
      },
    ]);
    if (action === "Geri") return;
    if (action === "Oluştur") {
      const event = await inquirer.prompt([
        { type: "input", name: "summary", message: "Başlık" },
        { type: "input", name: "start", message: "Başlangıç (örn: 01.12.2025 14:00 veya 2025-12-01 14:00)" },
        { type: "number", name: "duration", message: "Süre (dk)", default: 60 },
        { type: "input", name: "location", message: "Yer (opsiyonel)", default: "" },
        { type: "editor", name: "description", message: "Açıklama" },
      ]);
      const startDT = parseFlexibleDateTime(event.start);
      if (!startDT.isValid) {
        console.log(err("Geçersiz başlangıç."));
        return;
      }
      const startISO = startDT.toISO();
      const endISO = startDT
        .plus({ minutes: event.duration || 60 })
        .toISO();
      const id = `ev-${Date.now()}`;
      store.events.push({
        id,
        summary: event.summary,
        startISO,
        endISO,
        location: event.location,
        desc: event.description,
      });
      await writeStore(store);
      console.log(ok(`Oluşturuldu #${id}`));
      return;
    }
    if (action === "Listele") {
      const table = new Table({ head: ["ID", "Başlık", "Başlangıç", "Bitiş", "Yer"] });
      (store.events || []).forEach((event) => {
        table.push([event.id, event.summary, event.startISO, event.endISO, event.location || "-"]);
      });
      console.log(table.toString());
      return;
    }
    if (action === "Düzenle") {
      const { id } = await inquirer.prompt([{ type: "input", name: "id", message: "ID" }]);
      const event = (store.events || []).find((item) => item.id === id);
      if (!event) {
        console.log(err("Bulunamadı."));
        return;
      }
      const updates = await inquirer.prompt([
        { type: "input", name: "summary", message: "Başlık", default: event.summary },
        { type: "input", name: "startISO", message: "Başlangıç (örn: 01.12.2025 14:00)", default: event.startISO },
        { type: "input", name: "endISO", message: "Bitiş (örn: 01.12.2025 15:00)", default: event.endISO },
        { type: "input", name: "location", message: "Yer", default: event.location || "" },
        { type: "editor", name: "desc", message: "Açıklama", default: event.desc || "" },
      ]);
      const updStart = parseFlexibleDateTime(updates.startISO);
      const updEnd = parseFlexibleDateTime(updates.endISO);
      if (!updStart.isValid || !updEnd.isValid) {
        console.log(err("Geçersiz başlangıç/bitiş."));
        return;
      }
      Object.assign(event, { ...updates, startISO: updStart.toISO(), endISO: updEnd.toISO() });
      await writeStore(store);
      console.log(ok("Güncellendi."));
      return;
    }
    if (action === "Sil") {
      const { id } = await inquirer.prompt([{ type: "input", name: "id", message: "ID" }]);
      const index = (store.events || []).findIndex((item) => item.id === id);
      if (index >= 0) {
        store.events.splice(index, 1);
        await writeStore(store);
        console.log(ok("Silindi."));
      } else {
        console.log(err("Bulunamadı."));
      }
      return;
    }
    if (action === "Hatırlat ayarla") {
      const { id, minutes } = await inquirer.prompt([
        { type: "input", name: "id", message: "Etkinlik ID" },
        { type: "number", name: "minutes", message: "Kaç dk önce?", default: 10 },
      ]);
      const event = (store.events || []).find((item) => item.id === id);
      if (!event) {
        console.log(err("Bulunamadı."));
        return;
      }
      const when = DateTime.fromISO(event.startISO).minus({ minutes }).toISO();
      store.alarms ||= [];
      const alarmId = `cal-${Date.now()}`;
      store.alarms.push({ id: alarmId, type: "alarm", message: event.summary, when });
      await writeStore(store);
      await scheduleAbsolute(when, event.summary);
      console.log(ok("Hatırlatıcı planlandı."));
    }
  }

  return {
    id: "calendar-tools",
    label: "Takvim yönetimi",
    description: "Yerel etkinlikleri oluştur, düzenle ve hatırlatıcı ayarla.",
    items: [{ id: "calendar-tools-run", label: "Takvimi yönet", run: manageCalendar }],
  };
}



