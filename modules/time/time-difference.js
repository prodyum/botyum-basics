// Description: Implements the time difference features.

export function createTimeDifferenceGroup(ctx) {
  const { inquirer, ok, err, dim, DateTime, Interval } = ctx;

  async function calculateDifference() {
    const answers = await inquirer.prompt([
      { type: "input", name: "start", message: "Başlangıç (ISO)" },
      { type: "input", name: "end", message: "Bitiş (ISO)" },
    ]);
    const start = DateTime.fromISO(answers.start, { setZone: true });
    const end = DateTime.fromISO(answers.end, { setZone: true });
    if (!start.isValid || !end.isValid) {
      console.log(err("Geçersiz tarih/saat."));
      return;
    }
    const interval = Interval.fromDateTimes(start, end);
    const duration = interval.toDuration(["years", "months", "days", "hours", "minutes", "seconds"]);
    console.log(ok(`Fark: ${duration.toHuman({ maximumFractionDigits: 2 })}`));
    console.log(dim(`Saat: ${interval.length("hours").toFixed(2)} | Dakika: ${interval.length("minutes").toFixed(2)}`));
  }

  return {
    id: "time-difference",
    label: "Zaman farkı",
    description: "İki tarih/saat arasındaki farkı hesaplar.",
    items: [{ id: "time-difference-run", label: "Fark hesapla", run: calculateDifference }],
  };
}


