// Description: Implements the alarm features.

export function createAlarmGroup(ctx) {
  const { inquirer, ok, err, DateTime, readStore, writeStore } = ctx;

  async function scheduleAlarm() {
    const { whenStr, message } = await inquirer.prompt([
      { type: "input", name: "whenStr", message: "Zaman (ISO veya HH:mm)" },
      { type: "input", name: "message", message: "Mesaj", default: "Alarm!" },
    ]);
    let when = DateTime.fromISO(whenStr, { setZone: true });
    if (!when.isValid && /^\d{1,2}:\d{2}$/.test(whenStr)) {
      const [H, M] = whenStr.split(":").map(Number);
      when = DateTime.now().set({ hour: H, minute: M, second: 0, millisecond: 0 });
    }
    if (!when.isValid) {
      console.log(err("Geçerli bir zaman gir."));
      return;
    }
    if (when.diffNow().toMillis() <= 0) {
      console.log(err("Geçmişteki bir an için alarm oluşturulamaz."));
      return;
    }
    const id = `a-${Date.now()}`;
    const store = await readStore();
    store.alarms ||= [];
    store.alarms.push({ id, type: "alarm", message, when: when.toISO() });
    await writeStore(store);
    console.log(ok(`Alarm kaydedildi (#${id}) → ${when.toFormat("yyyy-MM-dd HH:mm:ss")}`));
  }

  return {
    id: "scheduler-alarm",
    label: "Alarm planlayıcı",
    description: "Belirli bir zaman için alarm kaydeder.",
    items: [{ id: "scheduler-alarm-run", label: "Alarm oluştur", run: scheduleAlarm }],
  };
}


