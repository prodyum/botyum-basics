// Description: Implements the pomodoro features.

import { sleep } from "./utils.js";

export function createPomodoroGroup(ctx) {
  const { inquirer, ok, title } = ctx;

  async function countdownMinutes(minutes, label) {
    const end = Date.now() + minutes * 60 * 1000;
    while (Date.now() < end) {
      const left = Math.ceil((end - Date.now()) / 1000);
      process.stdout.write(`\r${label}: ${left}s   `);
      await sleep(1000);
    }
    process.stdout.write("\n");
  }

  function beep(message) {
    process.stdout.write("\x07");
    console.log(ok(message));
  }

  async function runPomodoro() {
    const answers = await inquirer.prompt([
      { type: "number", name: "focus", message: "Odak süresi (dk)", default: 25 },
      { type: "number", name: "short", message: "Kısa mola (dk)", default: 5 },
      { type: "number", name: "cycles", message: "Döngü sayısı", default: 4 },
    ]);
    console.log(title(`Pomodoro: ${answers.cycles} x ${answers.focus}' + ${answers.short}'`));
    for (let i = 1; i <= answers.cycles; i += 1) {
      await countdownMinutes(answers.focus, `Odak ${i}/${answers.cycles}`);
      beep("Odak bitti. Kısa mola!");
      await countdownMinutes(answers.short, `Mola ${i}/${answers.cycles}`);
      beep("Mola bitti.");
    }
    console.log(ok("Pomodoro tamamlandı."));
  }

  return {
    id: "pomodoro",
    label: "Pomodoro koçu",
    description: "Odak ve mola döngülerini yönetir.",
    items: [{ id: "pomodoro-run", label: "Pomodoro başlat", run: runPomodoro }],
  };
}


