// modules/vision/camera-photo.js
// Captures still photos via platform camera tools.


import path from "path";
import fs from "fs-extra";

import { createVoiceUtils } from "../shared/workspace.js";

export function createCameraPhotoGroup(ctx) {
  const { inquirer, ok, err, exec, isMac, isWindows } = ctx;
  const { BASE, hasCommand } = createVoiceUtils(ctx);

  async function takePhoto() {
    const haveFfmpeg = await hasCommand("ffmpeg");
    if (!haveFfmpeg) {
      console.log(err("ffmpeg gerekli."));
      return;
    }
    const dir = path.join(BASE, "camera");
    await fs.ensureDir(dir);
    const out = path.join(dir, `photo-${Date.now()}.jpg`);
    try {
      if (isMac()) {
        await exec(`ffmpeg -f avfoundation -i "0" -frames:v 1 -y "${out}"`);
      } else if (isWindows()) {
        await exec(`ffmpeg -f dshow -i video="Integrated Camera" -frames:v 1 -y "${out}"`);
      } else {
        await exec(`ffmpeg -f v4l2 -i /dev/video0 -frames:v 1 -y "${out}"`);
      }
      console.log(ok(`Fotoğraf: ${out}`));
    } catch (error) {
      console.log(err(`Kamera/fotoğraf hatası: ${error.message}`));
    }
  }

  return {
    id: "camera-photo",
    label: "Kamera fotoğrafı",
    description: "Web kameradan tek kare fotoğraf çeker.",
    items: [{ id: "camera-photo-run", label: "Fotoğraf çek", run: takePhoto }],
  };
}




