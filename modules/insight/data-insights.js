// Description: Implements the data insights features.
import fs from "fs-extra";

export function createDataInsightsGroup(ctx) {
  const { inquirer, ok, err } = ctx;

  async function csvMiniStatsMenu() {
    const { filepath } = await inquirer.prompt([
      { type: "input", name: "filepath", message: "CSV dosya yolu:" },
    ]);
    try {
      const data = await fs.readFile(filepath, "utf8");
      const lines = data.split(/\r?\n/).filter((line) => line.trim());
      const values = lines
        .map((line) => parseFloat(line.split(",")[1]))
        .filter((value) => !Number.isNaN(value));
      if (!values.length) {
        console.log(err("Sayı verisi yok."));
        return;
      }
      const sum = values.reduce((acc, item) => acc + item, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      console.log(ok(`Ortalama: ${avg.toFixed(2)}, Min: ${min}, Max: ${max}`));
    } catch (error) {
      console.log(err(`CSV okunamadı: ${error.message}`));
    }
  }

  return {
    id: "data-insights",
    label: "Veri ve Analiz",
    description: "CSV dosyaları için hızlı istatistikler.",
    items: [
      { id: "csv-stats", label: "CSV mini istatistik", run: csvMiniStatsMenu },
    ],
  };
}


