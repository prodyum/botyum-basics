// modules/voice/speech-tools.js
// Speech transcription and playback helpers.

import fs from "fs-extra";
import path from "path";

import { createVoiceUtils } from "../shared/workspace.js";

export function createSpeechToolsGroup(ctx) {
  const {
    inquirer,
    ok,
    err,
    warn,
    dim,
    title,
    printDivider,
    curl,
    readStore,
    writeStore,
    ttsSay,
    exec,
    open,
    isWindows,
    isMac,
  } = ctx;

  const {
    BASE,
    TMP,
    sleep,
    trunc,
    hasCommand,
    writeClipboard,
    runTesseract,
    transcribeFile,
    sttHelperHTML,
  } = createVoiceUtils({ exec, isWindows, isMac });

  async function speechToClipboardMenu() {
    const { mode } = await inquirer.prompt([
      {
        type: "list",
        name: "mode",
        message: "STT modu:",
        choices: [
          { name: "Yerel (ffmpeg + whisper/vosk)", value: "local" },
          { name: "Chrome Web Speech (tarayıcıda)", value: "chrome" },
          { name: "Ses dosyasından transkript", value: "file" },
          { name: "Geri", value: "back" },
        ],
      },
    ]);
    if (mode === "back") return;

    if (mode === "local") {
      const haveFFmpeg = await hasCommand("ffmpeg");
      if (!haveFFmpeg) {
        console.log(err("ffmpeg gerekli."));
        return;
      }
      const { secs } = await inquirer.prompt([
        { type: "number", name: "secs", message: "Kaç saniye kaydedilsin?", default: 10 },
      ]);
      const wav = path.join(TMP, `mic-${Date.now()}.wav`);
      try {
        if (isMac()) {
          await exec(`ffmpeg -f avfoundation -i ":0" -t ${secs} -ac 1 -ar 16000 -y "${wav}"`);
        } else if (isWindows()) {
          await exec(`ffmpeg -f dshow -i audio="virtual-audio-capturer" -t ${secs} -ac 1 -ar 16000 -y "${wav}"`);
        } else {
          await exec(`ffmpeg -f alsa -i default -t ${secs} -ac 1 -ar 16000 -y "${wav}"`);
        }
      } catch (error) {
        console.log(err(`Mikrofon kaydı başarısız: ${error.message}`));
        return;
      }
      const text = (await transcribeFile(wav)).trim();
      if (text) {
        await writeClipboard(text);
        console.log(ok("Panoya yazıldı."));
      }
      return;
    }

    if (mode === "file") {
      const { file } = await inquirer.prompt([
        { type: "input", name: "file", message: "Ses dosyası yolu (wav/mp3/m4a):" },
      ]);
      const text = (await transcribeFile(file)).trim();
      if (text) {
        await writeClipboard(text);
        console.log(ok("Panoya yazıldı."));
      }
      return;
    }

    if (mode === "chrome") {
      const html = sttHelperHTML();
      const tmpPath = path.join(TMP, `stt-helper-${Date.now()}.html`);
      await fs.writeFile(tmpPath, html, "utf8");
      await open(tmpPath);
      console.log(ok("Tarayıcı sayfası açıldı. Mikrofon izni ver ve konuşma panoya düşecek."));
    }
  }

  async function wakeWordHandsFreeMenu() {
    const { wake, secs } = await inquirer.prompt([
      { type: "input", name: "wake", message: "Uyandırma sözcüğü:", default: "botyum" },
      { type: "number", name: "secs", message: "Dinleme penceresi (sn):", default: 7 },
    ]);
    console.log(dim("Basit STT + uyandırma döngüsü (ffmpeg + whisper/vosk). Ctrl+C ile çık."));
    const haveFFmpeg = await hasCommand("ffmpeg");
    if (!haveFFmpeg) {
      console.log(err("ffmpeg yok."));
      return;
    }
    while (true) {
      const tmp = path.join(TMP, `wake-${Date.now()}.wav`);
      try {
        if (isMac()) {
          await exec(`ffmpeg -f avfoundation -i ":0" -t ${secs} -ac 1 -ar 16000 -y "${tmp}"`);
        } else if (isWindows()) {
          await exec(`ffmpeg -f dshow -i audio="virtual-audio-capturer" -t ${secs} -ac 1 -ar 16000 -y "${tmp}"`);
        } else {
          await exec(`ffmpeg -f alsa -i default -t ${secs} -ac 1 -ar 16000 -y "${tmp}"`);
        }
      } catch {
        console.log(err("Mikrofon/ffmpeg erişilemedi."));
        return;
      }
      const text = (await transcribeFile(tmp)).toLowerCase();
      if (!text) continue;
      if (text.includes(wake.toLowerCase())) {
        console.log(ok("Uyandırma sözcüğü algılandı."));
        await ttsSay("Dinliyorum");
        const { cmd } = await inquirer.prompt([
          { type: "input", name: "cmd", message: "Komut (metin):" },
        ]);
        await ttsSay(`Komut alındı: ${cmd}`);
        break;
      }
    }
  }

  async function transcribeAudioMenu() {
    const { file } = await inquirer.prompt([
      { type: "input", name: "file", message: "Ses dosyası (wav/mp3/m4a):" },
    ]);
    const text = await transcribeFile(file);
    if (text) {
      console.log(ok("Transkript (ilk 2KB):\n") + trunc(text, 2000));
    }
  }

  async function voiceNotesMenu() {
    const haveFFmpeg = await hasCommand("ffmpeg");
    if (!haveFFmpeg) {
      console.log(err("ffmpeg gerekli."));
      return;
    }
    const { secs } = await inquirer.prompt([
      { type: "number", name: "secs", message: "Süre (sn):", default: 30 },
    ]);
    const dir = path.join(BASE, "voice-notes");
    await fs.ensureDir(dir);
    const out = path.join(dir, `note-${Date.now()}.m4a`);
    try {
      if (isMac()) {
        await exec(`ffmpeg -f avfoundation -i ":0" -t ${secs} -y "${out}"`);
      } else if (isWindows()) {
        await exec(`ffmpeg -f dshow -i audio="virtual-audio-capturer" -t ${secs} -y "${out}"`);
      } else {
        await exec(`ffmpeg -f alsa -i default -t ${secs} -y "${out}"`);
      }
      console.log(ok("Kaydedildi: " + out));
    } catch (error) {
      console.log(err(`Kayıt hatası: ${error.message}`));
    }
  }

  return {
    id: "speech-tools",
    label: "Ses ve Konuşma",
    description: "Konuşma tanıma, wake word ve sesli notlar.",
    items: [
      { id: "speech-clipboard", label: "Konuşmayı panoya aktar", run: speechToClipboardMenu },
      { id: "wake-word", label: "Wake word kipi", run: wakeWordHandsFreeMenu },
      { id: "transcribe", label: "Ses dosyası çözümle", run: transcribeAudioMenu },
      { id: "voice-notes", label: "Sesli notlar", run: voiceNotesMenu },
    ],
  };
}




