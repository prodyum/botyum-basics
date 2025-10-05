// Description: Implements the pdf narrator features.

import fs from "fs-extra";

export function createPdfNarratorGroup(ctx) {
  const { inquirer, ok, err, dim, printDivider, ttsSay } = ctx;

  async function narratePdf() {
    const { file } = await inquirer.prompt([{ type: "input", name: "file", message: "PDF dosya yolu" }]);
    if (!file) {
      console.log(err("Dosya yolu gerekli."));
      return;
    }
    try {
      const { default: pdfParse } = await import("pdf-parse");
      const buffer = await fs.readFile(file);
      const parsed = await pdfParse(buffer);
      const text = (parsed.text || "").slice(0, 5000);
      if (!text.trim()) {
        console.log(err("PDF içeriği okunamadı."));
        return;
      }
      console.log(dim("Örnek içerik (5000 karakter):"));
      console.log(text);
      const { speak } = await inquirer.prompt([
        { type: "confirm", name: "speak", message: "Metni seslendireyim mi?", default: false },
      ]);
      if (speak) {
        await ttsSay(text.slice(0, 1000));
        console.log(ok("Seslendirme tamamlandı (ilk 1000 karakter)."));
      }
      printDivider();
    } catch (error) {
      console.log(err(`PDF okunamadı: ${error.message}`));
    }
  }

  return {
    id: "pdf-narrator",
    label: "PDF seslendirme",
    description: "PDF dosyalarını okur ve isteğe bağlı seslendirir.",
    items: [{ id: "pdf-narrator-run", label: "PDF seslendir", run: narratePdf }],
  };
}


