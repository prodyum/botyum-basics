// modules/shared/workspace.js
// Provides shared filesystem and runtime helpers for modules needing temp paths, OCR, and clipboard utilities.


import fs from "fs-extra";
import os from "os";
import path from "path";

export function createWorkspaceHelpers(ctx) {
  const { exec, isWindows, isMac } = ctx;
  const HOME = os.homedir();
  const BASE = path.join(HOME, ".botyum");
  const TMP = path.join(BASE, "tmp");
  const DOCS = path.join(process.cwd(), "documents");
  fs.ensureDirSync(BASE);
  fs.ensureDirSync(TMP);
  fs.ensureDirSync(DOCS);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const trunc = (value, length = 2000) => {
    const text = String(value ?? "");
    return text.length > length ? `${text.slice(0, length)}…` : text;
  };

  async function hasCommand(name) {
    try {
      if (isWindows()) {
        await exec(`where ${name}`);
      } else {
        await exec(`which ${name}`);
      }
      return true;
    } catch {
      return false;
    }
  }

  async function writeClipboard(text) {
    try {
      if (isMac()) {
        await exec(`pbcopy`, { input: text });
      } else if (isWindows()) {
        await exec(
          `powershell -NoProfile -Command "Set-Clipboard -Value @'\n${text}\n'@"`,
        );
      } else {
        try {
          await exec(`xclip -selection clipboard`, { input: text });
        } catch {
          await exec(`xsel --clipboard --input`, { input: text });
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  async function runTesseract(imagePath) {
    const have = await hasCommand("tesseract");
    if (!have) return "";
    try {
      const outBase = path.join(TMP, `ocr-${Date.now()}`);
      await exec(`tesseract "${imagePath}" "${outBase}" -l tur+eng`);
      return fs.readFile(`${outBase}.txt`, "utf8");
    } catch {
      return "";
    }
  }

  async function transcribeFile(file) {
    const haveWhisperMain = await hasCommand("main");
    const haveWhisper = haveWhisperMain || (await hasCommand("whisper.cpp"));
    const haveVosk = (await hasCommand("vosk-transcriber")) || (await hasCommand("vosk"));
    try {
      if (haveWhisper) {
        const out = path.join(TMP, `stt-${Date.now()}.txt`);
        try {
          await exec(`main -m models/ggml-base.bin -f "${file}" -of "${out}"`);
        } catch {
          await exec(`whisper.cpp -m models/ggml-base.bin -f "${file}" -of "${out}"`);
        }
        return fs.readFile(out, "utf8");
      }
      if (haveVosk) {
        const { stdout } = await exec(`vosk-transcriber "${file}"`);
        return stdout;
      }
      return "";
    } catch {
      return "";
    }
  }

  function sttHelperHTML() {
    return `<!doctype html><meta charset="utf-8">
<title>botyum STT Helper</title>
<style>body{font:16px system-ui;padding:24px}textarea{width:100%;height:220px}</style>
<h1>Konuş ve panoya kopyalansın</h1>
<button id="start">Başlat</button> <button id="stop">Dur</button>
<textarea id="out" placeholder="Transkript burada..."></textarea>
<script>
let rec;
function copy(t){navigator.clipboard && navigator.clipboard.writeText(t).catch(()=>{});}
document.getElementById('start').onclick = ()=>{
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ alert('Tarayıcı Web Speech API desteklemiyor.'); return; }
  rec = new SR(); rec.lang='tr-TR'; rec.interimResults=true; rec.continuous=true;
  let final=''; rec.onresult = (e)=>{ let t=''; for(let i=e.resultIndex;i<e.results.length;i++){ t += e.results[i][0].transcript; if(e.results[i].isFinal){ final += t + ' '; t=''; } } document.getElementById('out').value = final + ' ' + t; copy(document.getElementById('out').value); };
  rec.start();
};
document.getElementById('stop').onclick = ()=>{ if(rec){ rec.stop(); } };
</script>`;
  }

  return {
    HOME,
    BASE,
    TMP,
    DOCS,
    sleep,
    trunc,
    hasCommand,
    writeClipboard,
    runTesseract,
    transcribeFile,
    sttHelperHTML,
  };
}




export { createWorkspaceHelpers as createVoiceUtils };


