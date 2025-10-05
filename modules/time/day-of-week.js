// Description: Implements the day of week features.

export function createDayOfWeekGroup(ctx) {
  const { inquirer, ok, err, DateTime } = ctx;

  async function findWeekday() {
    const { value } = await inquirer.prompt([
      { type: "input", name: "value", message: "Tarih (ISO)" },
    ]);
    const dt = DateTime.fromISO(value, { setZone: true });
    if (!dt.isValid) {
      console.log(err("Geçersiz tarih/saat girdisi."));
      return;
    }
    console.log(ok(`${dt.toFormat("yyyy-MM-dd")} → ${dt.weekdayLong}`));
  }

  return {
    id: "time-weekday",
    label: "Haftanın günü",
    description: "Girilen tarihin haftanın hangi gününe denk geldiğini gösterir.",
    items: [{ id: "time-weekday-run", label: "Günü bul", run: findWeekday }],
  };
}


