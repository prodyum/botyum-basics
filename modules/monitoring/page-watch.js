// modules/monitoring/page-watch.js
// Watches web pages for changes and notifies on diffs.


import { createVoiceUtils } from "../shared/workspace.js";

export function createPageWatchGroup(ctx) {
  const { inquirer, ok, warn, err, dim, curl, ttsSay, printDivider } = ctx;
  const { sleep } = createVoiceUtils(ctx);

  async function monitorPage() {
    const answers = await inquirer.prompt([
      { type: "input", name: "url", message: "URL" },
      { type: "input", name: "needle", message: "İzlenecek ifade / regex" },
      { type: "number", name: "seconds", message: "Kontrol sıklığı (sn)", default: 60 },
    ]);
    if (!answers.url || !answers.needle) {
      console.log(err("URL ve ifade gerekli."));
      return;
    }
    console.log(dim("Ctrl+C ile durdurabilirsiniz."));
    let lastHash = "";
    while (true) {
      try {
        const html = await curl(answers.url, { Accept: "text/html" }, 20);
        const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
        const match = text.match(new RegExp(answers.needle, "i")) || [];
        const snippet = match[0] || "";
        const hash = Buffer.from(snippet).toString("base64");
        if (lastHash && hash !== lastHash) {
          console.log(ok("🔔 Değişiklik algılandı:"), snippet.slice(0, 200));
          process.stdout.write("\x07");
          await ttsSay("Sayfada değişiklik var");
          printDivider();
        }
        lastHash = hash;
      } catch (error) {
        console.log(warn(`Erişim hatası: ${error.message}`));
      }
      await sleep(answers.seconds * 1000);
    }
  }

  return {
    id: "page-watch",
    label: "Sayfa izleme",
    description: "Belirli bir ifadeyi düzenli aralıklarla kontrol eder.",
    items: [{ id: "page-watch-run", label: "Sayfayı izle", run: monitorPage }],
  };
}




