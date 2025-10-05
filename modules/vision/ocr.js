// modules/vision/ocr.js
// Runs OCR against existing image files using Tesseract.


import path from "path";

import { createVoiceUtils } from "../shared/workspace.js";

export function createOcrGroup(ctx) {
  const { inquirer, ok, err, title, printDivider, exec } = ctx;
  const { TMP, hasCommand, runTesseract, trunc } = createVoiceUtils(ctx);

  async function runOcr() {
    const { file } = await inquirer.prompt([
      { type: "input", name: "file", message: "PDF veya resim dosyası" },
    ]);
    if (!file) return;
    const haveTesseract = await hasCommand("tesseract");
    if (!haveTesseract) {
      console.log(err("tesseract gerekli."));
      return;
    }
    if (/\.pdf$/i.test(file)) {
      try {
        if (await hasCommand("pdftoppm")) {
          const base = path.join(TMP, `ocrpdf-${Date.now()}`);
          await exec(`pdftoppm "${file}" "${base}" -singlefile -png`);
          const text = await runTesseract(`${base}.png`);
          console.log(title("OCR metin (ilk 3000):"));
          console.log(trunc(text, 3000));
        } else {
          const text = await runTesseract(file);
          console.log(title("OCR metin (ilk 3000):"));
          console.log(trunc(text, 3000));
        }
      } catch (error) {
        console.log(err(`OCR/pdftoppm hatası: ${error.message}`));
      }
    } else {
      const text = await runTesseract(file);
      console.log(title("OCR metin (ilk 3000):"));
      console.log(trunc(text, 3000));
    }
    printDivider();
  }

  return {
    id: "pdf-ocr",
    label: "PDF/Resim OCR",
    description: "Tesseract ile metin çıkarır.",
    items: [{ id: "pdf-ocr-run", label: "Dosyayı OCR yap", run: runOcr }],
  };
}




