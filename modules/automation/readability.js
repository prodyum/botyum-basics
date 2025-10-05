// Description: Implements the readability features.

import Table from "cli-table3";

export function createReadabilityGroup(ctx) {
  const { inquirer, ok, err, dim, title, printDivider } = ctx;

  async function analyzeText() {
    const { text } = await inquirer.prompt([
      { type: "editor", name: "text", message: "Analiz edilecek metin" },
    ]);
    const content = (text || "").replace(/\s+/g, " ").trim();
    if (!content) {
      console.log(err("Boş metin."));
      return;
    }
    const sentences = content.split(/(?<=[.!?])\s+/).filter(Boolean);
    const words = content.split(/\s+/).filter(Boolean);
    const chars = words.join("").length;
    const W = words.length || 1;
    const S = sentences.length || 1;
    const C = chars;
    const ARI = 4.71 * (C / W) + 0.5 * (W / S) - 21.43;
    const table = new Table({ head: ["Cümle", "Kelime", "Karakter", "ARI (~sınıf)"] });
    table.push([S, W, C, ARI.toFixed(2)]);
    console.log(title("Okunabilirlik özeti (ARI)"));
    console.log(table.toString());
    console.log(dim("Not: ARI İngilizce metinler için tasarlanmıştır; diğer dillerde yaklaşık sonuç verir."));
    printDivider();
  }

  return {
    id: "readability",
    label: "Okunabilirlik analizi",
    description: "Metnin ARI skorunu hesaplar.",
    items: [{ id: "readability-run", label: "Metni analiz et", run: analyzeText }],
  };
}


