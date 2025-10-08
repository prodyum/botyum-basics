// Description: Implements the pdf narrator features.

import fs from "fs-extra";
import path from "path";

export function createPdfNarratorGroup(ctx) {
  const { inquirer, ok, err, dim, printDivider, ttsStart, ttsStop } = ctx;

  async function narratePdf() {
    const { file } = await inquirer.prompt([{ type: "input", name: "file", message: "PDF dosya yolu" }]);
    if (!file) {
      console.log(err("Dosya yolu gerekli."));
      return;
    }
    try {
      // pdf-parse'in paket girisi (index.js), ESM altinda \"debug\" moduna girip
      // var olmayan test PDF dosyasini acmaya calisabiliyor. Bu nedenle dogrudan lib'e import ediyoruz.
      let pdfParse;
      try {
        const mod = await import("pdf-parse/lib/pdf-parse.js");
        pdfParse = mod.default || mod;
      } catch {
        const mod = await import("pdf-parse");
        pdfParse = mod.default || mod;
      }

      // Kullanici bir klasor vermis olabilir; once yolun varligini ve turunu dogrula
      const resolvedPath = path.resolve(file);
      console.log(dim(`Okunacak dosya: ${resolvedPath}`));
      if (!/\.pdf$/i.test(resolvedPath)) {
        console.log(err("Lütfen .pdf uzantılı bir dosya verin."));
        return;
      }
      let stats;
      try {
        stats = await fs.stat(resolvedPath);
      } catch {
        console.log(err(`PDF bulunamadı: ${resolvedPath}`));
        return;
      }
      if (stats.isDirectory()) {
        console.log(err("Bir klasör yolu girdiniz. Lütfen doğrudan bir PDF dosyasının tam yolunu verin (örn. C:/.../dosya.pdf)."));
        return;
      }

      const buffer = await fs.readFile(resolvedPath);
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
        const snippet = text.slice(0, 1000);
        await ttsStop();
        await ttsStart(snippet);
        const { stopNow } = await inquirer.prompt([
          { type: "confirm", name: "stopNow", message: "Durdurmak ister misiniz?", default: false },
        ]);
        if (stopNow) {
          await ttsStop();
          console.log(ok("Seslendirme durduruldu."));
        } else {
          console.log(ok("Seslendirme başlatıldı (ilk 1000 karakter)."));
        }
      }
      printDivider();
    } catch (error) {
      console.log(err(`PDF okunamadı: ${error.message}`));
      if (process.env.DEBUG) {
        console.log(dim(error.stack || ""));
      }
    }
  }

  return {
    id: "pdf-narrator",
    label: "PDF seslendirme",
    description: "PDF dosyalarını okur ve isteğe bağlı seslendirir.",
    items: [
      { id: "pdf-narrator-run", label: "PDF seslendir", run: narratePdf },
    ],
  };
}


