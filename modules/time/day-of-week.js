// Description: Implements the day of week features.
import { parseFlexibleDateTime } from "../core/utils.js";

export function createDayOfWeekGroup(ctx) {
  const { inquirer, ok, err } = ctx;

  async function findWeekday() {
    const { value } = await inquirer.prompt([
      { type: "input", name: "value", message: "Tarih (örn: 12.10.2025, 12/10/2025, 2025-10-12, 14:30 dahil değil)" },
    ]);
    const dt = parseFlexibleDateTime(value);
    if (!dt.isValid) {
      console.log(err("Geçersiz tarih/saat girdisi. Örnekler: 2025-10-12, 12.10.2025, 12/10/2025"));
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


