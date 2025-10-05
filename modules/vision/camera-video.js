// modules/vision/camera-video.js
// Records short video clips via platform camera tools.


import path from "path";
import fs from "fs-extra";

import { createVoiceUtils } from "../shared/workspace.js";

export function createCameraVideoGroup(ctx) {
  const { inquirer, ok, err, exec, isMac, isWindows } = ctx;
  const { BASE, hasCommand } = createVoiceUtils(ctx);

  async function recordVideo() {
    const haveFfmpeg = await hasCommand("ffmpeg");
    if (!haveFfmpeg) {
      console.log(err("ffmpeg gerekli."));
      return;
    }
    const { seconds } = await inquirer.prompt([
      { type: "number", name: "seconds", message: "Süre (sn)", default: 10 },
    ]);
    const dir = path.join(BASE, "camera");
    await fs.ensureDir(dir);
    const out = path.join(dir, `video-${Date.now()}.mp4`);
    try {
      if (isMac()) {
        await exec(`ffmpeg -f avfoundation -framerate 30 -i "0" -t ${seconds} -y "${out}"`);
      } else if (isWindows()) {
        await exec(`ffmpeg -f dshow -i video="Integrated Camera" -t ${seconds} -y "${out}"`);
      } else {
        await exec(`ffmpeg -f v4l2 -i /dev/video0 -t ${seconds} -y "${out}"`);
      }
      console.log(ok(`Video kaydedildi: ${out}`));
    } catch (error) {
      console.log(err(`Kamera/video hatası: ${error.message}`));
    }
  }

  return {
    id: "camera-video",
    label: "Kamera video kaydı",
    description: "Web kameradan kısa video kaydeder.",
    items: [{ id: "camera-video-run", label: "Video kaydet", run: recordVideo }],
  };
}




