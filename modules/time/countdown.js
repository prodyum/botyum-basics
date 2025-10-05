// modules/time/countdown.js
// Schedules countdown timers with persistent storage.


import path from "path";

import { createVoiceUtils } from "../shared/workspace.js";

function parseDuration(input) {
  const s = String(input || "").trim().toLowerCase();
  if (!s) return NaN;
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
    const parts = s.split(":").map(Number);
    const [hours = 0, minutes = 0, seconds = 0] = [parts[0], parts[1], parts[2] ?? 0];
    return ((hours * 60 + minutes) * 60 + seconds) * 1000;
  }
  const rx = /(\d+)\s*(d|h|m|s)/g;
  let total = 0;
  let match;
  while ((match = rx.exec(s)) !== null) {
    const value = Number(match[1]);
    const unit = match[2];
    if (unit === "d") total += value * 24 * 3600 * 1000;
    if (unit === "h") total += value * 3600 * 1000;
    if (unit === "m") total += value * 60 * 1000;
    if (unit === "s") total += value * 1000;
  }
  return total || NaN;
}

export function createCountdownGroup(ctx) {
  const { inquirer, ok, err, DateTime, readStore, writeStore } = ctx;
  createVoiceUtils(ctx); // ensure dirs exist

  async function scheduleCountdown() {
    const { duration, message } = await inquirer.prompt([
      { type: "input", name: "duration", message: "Süre (5m, 90s, 00:02:00 vb.)" },
      { type: "input", name: "message", message: "Mesaj", default: "Zamanlayıcı bitti!" },
    ]);
    const ms = parseDuration(duration);
    if (Number.isNaN(ms) || ms <= 0) {
      console.log(err("Geçerli bir süre gir."));
      return;
    }
    const id = `t-${Date.now()}`;
    const when = DateTime.now().plus({ milliseconds: ms }).toISO();
    const store = await readStore();
    store.alarms ||= [];
    store.alarms.push({ id, type: "countdown", message, when });
    await writeStore(store);
    console.log(ok(`Planlandı (#${id}) → ${DateTime.fromISO(when).toFormat("yyyy-MM-dd HH:mm:ss")}`));
  }

  return {
    id: "scheduler-countdown",
    label: "Geri sayım planlayıcı",
    description: "Süre bazlı hatırlatıcı planlar.",
    items: [{ id: "scheduler-countdown-run", label: "Geri sayım oluştur", run: scheduleCountdown }],
  };
}




