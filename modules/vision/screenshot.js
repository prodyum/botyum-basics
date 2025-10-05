// modules/vision/screenshot.js
// Captures screenshots and optionally runs OCR.


import path from "path";

import { createVoiceUtils } from "../shared/workspace.js";

export function createScreenshotGroup(ctx) {
  const { exec, ok, err, warn, title, printDivider, isWindows, isMac } = ctx;
  const { TMP, runTesseract } = createVoiceUtils(ctx);

  async function captureScreenshot() {
    const out = path.join(TMP, `shot-${Date.now()}.png`);
    try {
      if (isMac()) {
        await exec(`screencapture -x "${out}"`);
      } else if (isWindows()) {
        const ps = `Add-Type -AssemblyName System.Windows.Forms;`
          + `Add-Type -AssemblyName System.Drawing;`
          + `$bmp = New-Object Drawing.Bitmap([System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width,`
          + `[System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height);`
          + `$gr = [System.Drawing.Graphics]::FromImage($bmp);`
          + `$gr.CopyFromScreen([System.Drawing.Point]::new(0,0), [System.Drawing.Point]::new(0,0), $bmp.Size);`
          + `$bmp.Save('${out.replace(/\\/g, "\\\\")}', [System.Drawing.Imaging.ImageFormat]::Png);`;
        await exec(`powershell -NoProfile -Command "${ps}"`);
      } else {
        try {
          await exec(`gnome-screenshot -f "${out}"`);
        } catch {
          await exec(`import -window root "${out}"`);
        }
      }
      console.log(ok(`Ekran görüntüsü: ${out}`));
    } catch (error) {
      console.log(err(`Ekran görüntüsü alınamadı: ${error.message}`));
      return;
    }

    const text = await runTesseract(out);
    if (text) {
      console.log(title("OCR Metin (kısaltılmış):"));
      console.log(text.split(/\s+/).slice(0, 80).join(" "));
      printDivider();
    } else {
      console.log(warn("OCR yapılamadı (tesseract?)."));
    }
  }

  return {
    id: "screenshot-ocr",
    label: "Ekran görüntüsü + OCR",
    description: "Ekranı yakalar ve metni çıkarmaya çalışır.",
    items: [{ id: "screenshot-ocr-run", label: "Ekran görüntüsü al", run: captureScreenshot }],
  };
}




