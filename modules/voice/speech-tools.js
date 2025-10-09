// modules/voice/speech-tools.js
// Minimal wake-word detector: prints when keyword is detected. Other tools removed.

import path from "path";
import http from "http";
import { createVoiceUtils } from "../shared/workspace.js";

export function createSpeechToolsGroup(ctx) {
  const { inquirer, ok, err, dim, exec, isWindows, isMac } = ctx;

  const { TMP, hasCommand, transcribeFile } = createVoiceUtils({ exec, isWindows, isMac });

  async function wakeWordBrowserFallback(wake) {
    return new Promise(async (resolve) => {
      const server = http.createServer((req, res) => {
        if (req.method === "GET" && req.url === "/") {
          const html = `<!doctype html><meta charset=\"utf-8\"><title>Wake Word Dinleme</title>
<style>body{font:16px system-ui;padding:24px}button{font:16px;padding:8px 12px}</style>
<h1>Wake Word Dinleme</h1>
<p>Butona tıkla ve anahtar kelimeyi söyle: <b>${wake}</b></p>
<button id=\"start\">Başlat</button>
<script>
let rec;
document.getElementById('start').onclick = ()=>{
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ alert('Tarayıcı Web Speech API desteklemiyor. Chrome/Edge deneyin.'); return; }
  rec = new SR(); rec.lang='tr-TR'; rec.interimResults=true; rec.continuous=true;
  const wake = ${JSON.stringify(String(wake || "botyum").toLowerCase())};
  rec.onresult = (e)=>{
    let text='';
    for(let i=e.resultIndex;i<e.results.length;i++){ text += e.results[i][0].transcript; }
    if(text.toLowerCase().includes(wake)){
      fetch('/hit', {method:'POST'}).catch(()=>{});
      alert('Anahtar kelime yakalandı!');
      rec && rec.stop();
      window.close();
    }
  };
  rec.start();
};
<\/script>`;
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(html);
          return;
        }
        if (req.method === "POST" && req.url === "/hit") {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("ok");
          console.log(ok("Anahtar kelime yakalandı."));
          try { server.close(); } catch {}
          resolve();
          return;
        }
        res.writeHead(404);
        res.end();
      });
      server.listen(0, "127.0.0.1", async () => {
        const address = server.address();
        const port = typeof address === "object" && address ? address.port : 0;
        const url = `http://127.0.0.1:${port}/`;
        await ctx.open(url);
      });
      // Güvenlik için maksimum bekleme: 2 dakika
      setTimeout(() => {
        try { server.close(); } catch {}
        resolve();
      }, 120000);
    });
  }

  async function enumerateWindowsAudioInputs() {
    try {
      const { stdout, stderr } = await exec("ffmpeg -hide_banner -list_devices true -f dshow -i dummy");
      const text = String(stdout || "") + String(stderr || "");
      const lines = text.split(/\r?\n/);
      const names = [];
      let inAudioSection = false;
      for (const line of lines) {
        if (/DirectShow audio devices/i.test(line)) {
          inAudioSection = true;
          continue;
        }
        if (inAudioSection && /DirectShow video devices/i.test(line)) {
          break;
        }
        if (inAudioSection) {
          const m = line.match(/\"([^\"]+)\"/);
          if (m && m[1]) {
            names.push(m[1]);
          }
        }
      }
      // Tekrarlananları ayıkla
      return Array.from(new Set(names));
    } catch {
      return [];
    }
  }

  async function wakeWordMinimalMenu() {
    const { wake, secs, repeat } = await inquirer.prompt([
      { type: "input", name: "wake", message: "Uyandırma sözcüğü:", default: "botyum" },
      { type: "number", name: "secs", message: "Dinleme penceresi (sn):", default: 7 },
      { type: "confirm", name: "repeat", message: "Sürekli denensin mi?", default: false },
    ]);
    const haveFFmpeg = await hasCommand("ffmpeg");
    const haveWhisper = (await hasCommand("main")) || (await hasCommand("whisper.cpp"));
    const haveVosk = (await hasCommand("vosk-transcriber")) || (await hasCommand("vosk"));
    if (!haveWhisper && !haveVosk) {
      console.log(dim("Yerel STT bulunamadı (whisper/vosk). Tarayıcı tabanlı dinlemeye geçiliyor..."));
      await wakeWordBrowserFallback(wake);
      return;
    }
    if (!haveFFmpeg) {
      console.log(err("ffmpeg yok."));
      return;
    }

    let dshowDevice = "virtual-audio-capturer";
    if (isWindows()) {
      const inputs = await enumerateWindowsAudioInputs();
      if (inputs.length) {
        const { device } = await inquirer.prompt([
          { type: "list", name: "device", message: "Mikrofonunuzu seçin:", choices: inputs },
        ]);
        dshowDevice = device || dshowDevice;
      } else {
        const { device } = await inquirer.prompt([
          { type: "input", name: "device", message: "Mikrofon cihaz adı (dshow)", default: dshowDevice },
        ]);
        dshowDevice = device || dshowDevice;
      }
    }

    async function recordAndCheckOnce() {
      const tmp = path.join(TMP, `wake-${Date.now()}.wav`);
      try {
        if (isMac()) {
          await exec(`ffmpeg -nostdin -hide_banner -loglevel error -f avfoundation -i ":0" -t ${secs} -ac 1 -ar 16000 -y "${tmp}"`);
        } else if (isWindows()) {
          await exec(`ffmpeg -nostdin -hide_banner -loglevel error -f dshow -i audio="${dshowDevice}" -t ${secs} -ac 1 -ar 16000 -y "${tmp}"`);
        } else {
          await exec(`ffmpeg -nostdin -hide_banner -loglevel error -f alsa -i default -t ${secs} -ac 1 -ar 16000 -y "${tmp}"`);
        }
      } catch {
        console.log(err("Mikrofon/ffmpeg erişilemedi."));
        return false;
      }
      const text = (await transcribeFile(tmp)).toLowerCase();
      if (text && text.includes(wake.toLowerCase())) {
        console.log(ok("Anahtar kelime yakalandı."));
        return true;
      }
      return false;
    }

    if (!repeat) {
      console.log(dim("Mikrofon dinleniyor..."));
      const hit = await recordAndCheckOnce();
      if (!hit) {
        console.log(dim("Anahtar kelime bulunamadı. Tarayıcı tabanlı dinlemeye geçiliyor..."));
        await wakeWordBrowserFallback(wake);
      }
      return;
    }
    console.log(dim("Mikrofon dinleniyor (tekrarlı kip). Ctrl+C ile çık."));
    let attempts = 0;
    while (true) {
      const hit = await recordAndCheckOnce();
      if (hit) break;
      attempts += 1;
      if (attempts >= 1) {
        console.log(dim("Yerelde algılanamadı. Tarayıcı tabanlı dinlemeye geçiliyor..."));
        await wakeWordBrowserFallback(wake);
        break;
      }
    }
  }

  return {
    id: "speech-tools",
    label: "Ses ve Konuşma",
    description: "Wake-word: anahtar kelime yakalandığında bildirir.",
    items: [
      { id: "wake-word", label: "Wake word kipi", run: wakeWordMinimalMenu },
    ],
  };
}




