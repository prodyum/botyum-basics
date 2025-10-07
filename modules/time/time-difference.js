// Description: Implements the time difference features.

import { parseFlexibleDateTime } from "../core/utils.js";

export function createTimeDifferenceGroup(ctx) {
  const { inquirer, ok, err, dim, Interval } = ctx;

  async function calculateDifference() {
    const answers = await inquirer.prompt([
      { type: "input", name: "start", message: "Başlangıç (örn: 12.10.2025 09:00, 12/10/2025 09:00, 2025-10-12 09:00)" },
      { type: "input", name: "end", message: "Bitiş (örn: 20.10.2025 18:30, 20/10/2025 18:30, 2025-10-20 18:30)" },
    ]);
    const start = parseFlexibleDateTime(answers.start);
    const end = parseFlexibleDateTime(answers.end);
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


