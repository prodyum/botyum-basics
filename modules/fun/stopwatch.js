// modules/fun/stopwatch.js
// Start/stop stopwatch in the terminal.


export function createStopwatchGroup(ctx) {
  const { inquirer, ok, dim } = ctx;

  async function runStopwatch() {
    console.log(dim("Başlatmak için Enter"));
    await inquirer.prompt([{ type: "input", name: "start", message: "" }]);
    const start = Date.now();
    console.log(dim("Durdurmak için Enter"));
    await inquirer.prompt([{ type: "input", name: "stop", message: "" }]);
    const elapsed = Date.now() - start;
    const seconds = Math.floor(elapsed / 1000);
    const millis = elapsed % 1000;
    console.log(ok(`Geçen süre: ${seconds}.${String(millis).padStart(3, "0")} sn`));
  }

  return {
    id: "stopwatch",
    label: "Kronometre",
    description: "Başlat/durdur kronometre.",
    items: [{ id: "stopwatch-run", label: "Kronometreyi çalıştır", run: runStopwatch }],
  };
}



