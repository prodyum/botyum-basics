// modules/vision/qr-scanner.js
// Kameradan tek kare al, QR kodu çöz ve URL ise tarayıcıda aç.


import path from "path";
import fs from "fs-extra";
import { PNG } from "pngjs";
import jsqr from "jsqr";

import { createVoiceUtils } from "../shared/workspace.js";

export function createQrScannerGroup(ctx) {
  const { inquirer, ok, err, dim, open, exec, isWindows, isMac } = ctx;
  const { BASE, hasCommand } = createVoiceUtils({ exec, isWindows, isMac });

  function isLikelyUrl(text) {
    const t = String(text || "").trim();
    if (!t) return false;
    if (/^https?:\/\//i.test(t)) return true;
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(t)) return true;
    return false;
  }

  async function captureFrame(outPath) {
    const haveFfmpeg = await hasCommand("ffmpeg");
    if (!haveFfmpeg) throw new Error("ffmpeg gerekli.");
    if (isMac()) {
      await exec(`ffmpeg -hide_banner -loglevel error -f avfoundation -i "0" -frames:v 1 -y "${outPath}"`);
      return;
    }
    if (isWindows()) {
      // Varsayılan entegre kamera adı tahmini; kullanıcıdan alternatif isteyebiliriz.
      try {
        await exec(`ffmpeg -hide_banner -loglevel error -f dshow -i video="Integrated Camera" -frames:v 1 -y "${outPath}"`);
      } catch {
        // Sık adı geçen bir alternatif
        await exec(`ffmpeg -hide_banner -loglevel error -f dshow -i video="USB Camera" -frames:v 1 -y "${outPath}"`);
      }
      return;
    }
    await exec(`ffmpeg -hide_banner -loglevel error -f v4l2 -i /dev/video0 -frames:v 1 -y "${outPath}"`);
  }

  async function scanPngForQr(pngPath) {
    const buffer = await fs.readFile(pngPath);
    const png = PNG.sync.read(buffer);
    const code = jsqr(new Uint8ClampedArray(png.data.buffer), png.width, png.height);
    return code?.data || "";
  }

  async function runQrScanner() {
    const dir = path.join(BASE, "qr-scans");
    await fs.ensureDir(dir);
    const outPng = path.join(dir, `qr-${Date.now()}.png`);
    try {
      await captureFrame(outPng);
    } catch (e) {
      console.log(err(e.message || String(e)));
      return;
    }
    let text = "";
    try {
      text = await scanPngForQr(outPng);
    } catch (e) {
      console.log(err("Görüntü okunamadı."));
      return;
    }
    if (!text) {
      console.log(dim("QR bulunamadı."));
      return;
    }
    console.log(ok(`QR: ${text}`));
    if (isLikelyUrl(text)) {
      await open(/^https?:\/\//i.test(text) ? text : `https://${text}`);
      console.log(dim("Açıldı."));
    }
  }

  return {
    id: "qr-scanner",
    label: "QR tarayıcı",
    description: "Kameradan QR tarar ve URL ise açar.",
    items: [{ id: "qr-scanner-run", label: "QR tara", run: runQrScanner }],
  };
}





