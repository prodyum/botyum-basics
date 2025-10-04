// features6.js
// 22 ileri özellik: STT (yerel/Chrome), wake word, eş anlamlı sözlük,
// ekran görüntüsü + OCR, kullanıcı profili, sesli not, kamera video/foto,
// web bölüm izleme, trafik linkleri, Telegram kolaylıkları, ses dosyası transkript,
// takvim CRUD + hatırlatıcı, Office belge üretimi (LibreOffice), hızlı metin,
// documents/ gezgin + arama, PDF/Resim OCR, Issues (GitHub/Jira/Trello/Azure),
// Quora arama + özet, Reddit gönderi/yorumları, Slack (kanallar/mesaj).
//
// Dış araçlar (opsiyonel ama önerilir): ffmpeg, tesseract, pdftoppm, soffice,
// unzip, telegram-cli/tg, yt-dlp. Bulunamazsa özellik kibarca uyarır.

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import Table from 'cli-table3';
import { DateTime } from 'luxon';

export function registerFeatures6(ctx) {
  const {
    inquirer, curl, ok, err, warn, dim, title, printDivider,
    readStore, writeStore, exec, open, ttsSay, isWindows, isMac
  } = ctx;

  // ──────────────────────────────────────────────────────────────────────────
  // Ortak yardımcılar
  const HOME = os.homedir();
  const BASE = path.join(HOME, '.botyum');
  const TMP = path.join(BASE, 'tmp');
  const DOCS = path.join(process.cwd(), 'documents');
  fs.ensureDirSync(BASE); fs.ensureDirSync(TMP); fs.ensureDirSync(DOCS);

  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
  function trunc(s, n=2000){ s = String(s||''); return s.length>n ? s.slice(0,n)+'…' : s; }

  async function hasCmd(name) {
    try { await exec(isWindows() ? `where ${name}` : `which ${name}`); return true; }
    catch { return false; }
  }

  async function writeClipboard(text) {
    try {
      if (isMac()) await exec(`pbcopy`, { input: text });
      else if (isWindows()) await exec(`powershell -NoProfile -Command "Set-Clipboard -Value @'\n${text}\n'@"`);
      else {
        try { await exec(`xclip -selection clipboard`, { input: text }); }
        catch { await exec(`xsel --clipboard --input`, { input: text }); }
      }
      return true;
    } catch { return false; }
  }

  // OCR (tesseract)
  async function runTesseract(imgPath) {
    const have = await hasCmd('tesseract');
    if (!have) return '';
    try {
      const outBase = path.join(TMP, `ocr-${Date.now()}`);
      await exec(`tesseract "${imgPath}" "${outBase}" -l tur+eng`);
      return fs.readFile(`${outBase}.txt`, 'utf8');
    } catch { return ''; }
  }

  // Whisper/Vosk (STT) – dosyadan transkript
  async function transcribeFile(file) {
    const haveWhisperMain = await hasCmd('main');       // whisper.cpp binary ismi sıklıkla 'main'
    const haveWhisper = haveWhisperMain || await hasCmd('whisper.cpp');
    const haveVosk = await hasCmd('vosk-transcriber') || await hasCmd('vosk');
    try {
      if (haveWhisper) {
        const out = path.join(TMP, `stt-${Date.now()}.txt`);
        try { await exec(`main -m models/ggml-base.bin -f "${file}" -of "${out}"`); }
        catch { await exec(`whisper.cpp -m models/ggml-base.bin -f "${file}" -of "${out}"`); }
        return fs.readFile(out, 'utf8');
      }
      if (haveVosk) {
        const { stdout } = await exec(`vosk-transcriber "${file}"`);
        return stdout;
      }
      console.log(warn('Yerel STT aracı bulunamadı (whisper.cpp / vosk).'));
      return '';
    } catch (e) {
      console.log(err('Transkripsiyon hatası: ' + e.message));
      return '';
    }
  }

  // Chrome Web Speech yardımcı HTML
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

  // ──────────────────────────────────────────────────────────────────────────
  // 1) Speech-to-Clipboard (yerel STT veya Chrome Web Speech)
  async function speechToClipboardMenu() {
    const { mode } = await inquirer.prompt([{
      type:'list', name:'mode', message:'STT modu:', choices:[
        { name:'Yerel (ffmpeg + whisper/vosk)', value:'local' },
        { name:'Chrome Web Speech (tarayıcıda)', value:'chrome' },
        { name:'Ses dosyasından transkript', value:'file' },
        { name:'Geri', value:'back' }
      ]
    }]);
    if (mode==='back') return;

    if (mode==='local') {
      const haveFF = await hasCmd('ffmpeg');
      if (!haveFF) { console.log(err('ffmpeg gerekli.')); return; }
      const { secs } = await inquirer.prompt([{ type:'number', name:'secs', message:'Kaç saniye kaydedilsin?', default:10 }]);
      const wav = path.join(TMP, `mic-${Date.now()}.wav`);
      try {
        if (isMac()) await exec(`ffmpeg -f avfoundation -i ":0" -t ${secs} -ac 1 -ar 16000 -y "${wav}"`);
        else if (isWindows()) await exec(`ffmpeg -f dshow -i audio="virtual-audio-capturer" -t ${secs} -ac 1 -ar 16000 -y "${wav}"`);
        else await exec(`ffmpeg -f alsa -i default -t ${secs} -ac 1 -ar 16000 -y "${wav}"`);
      } catch (e) { console.log(err('Mikrofon kaydı başarısız: ' + e.message)); return; }
      const text = (await transcribeFile(wav)).trim();
      if (text) { await writeClipboard(text); console.log(ok('Panoya yazıldı.')); }
      return;
    }

    if (mode==='file') {
      const { f } = await inquirer.prompt([{ type:'input', name:'f', message:'Ses dosyası yolu (wav/mp3/m4a):' }]);
      const text = (await transcribeFile(f)).trim();
      if (text) { await writeClipboard(text); console.log(ok('Panoya yazıldı.')); }
      return;
    }

    if (mode==='chrome') {
      const html = sttHelperHTML();
      const file = path.join(TMP, 'chrome_stt_helper.html');
      await fs.writeFile(file, html, 'utf8');
      await open('file://' + file);
      console.log(dim('Tarayıcıda mikrofon izni ver; konuşma bitince metin otomatik kopyalanır.'));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2) Uyandırma sözcüğü + eller serbest
  async function wakeWordHandsFreeMenu() {
    const { wake, secs } = await inquirer.prompt([
      { type:'input', name:'wake', message:'Uyandırma sözcüğü:', default:'botyum' },
      { type:'number', name:'secs', message:'Dinleme penceresi (sn):', default:7 }
    ]);
    console.log(dim('Basit STT + uyandırma döngüsü (ffmpeg + whisper/vosk). Ctrl+C ile çık.'));
    while (true) {
      const tmp = path.join(TMP, `wake-${Date.now()}.wav`);
      try {
        const haveFF = await hasCmd('ffmpeg'); if (!haveFF) throw new Error('ffmpeg yok');
        if (isMac()) await exec(`ffmpeg -f avfoundation -i ":0" -t ${secs} -ac 1 -ar 16000 -y "${tmp}"`);
        else if (isWindows()) await exec(`ffmpeg -f dshow -i audio="virtual-audio-capturer" -t ${secs} -ac 1 -ar 16000 -y "${tmp}"`);
        else await exec(`ffmpeg -f alsa -i default -t ${secs} -ac 1 -ar 16000 -y "${tmp}"`);
      } catch { console.log(err('Mikrofon/ffmpeg erişilemedi.')); return; }
      const text = (await transcribeFile(tmp)).toLowerCase();
      if (!text) continue;
      if (text.includes(wake.toLowerCase())) {
        console.log(ok('Uyandırma sözcüğü algılandı.'));
        await ttsSay('Dinliyorum');
        const { cmd } = await inquirer.prompt([{ type:'input', name:'cmd', message:'Komut (metin):' }]);
        await ttsSay(`Komut alındı: ${cmd}`);
        break;
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3) Kullanıcı eş anlamlı sözlüğü
  async function synonymsMenu() {
    const s = await readStore(); s.synonyms ||= {};
    const { op } = await inquirer.prompt([{
      type:'list', name:'op', message:'Eş Anlamlı Sözlük:',
      choices:[
        { name:'Ekle/Güncelle', value:'set' },
        { name:'Listele', value:'list' },
        { name:'Sil', value:'del' },
        { name:'Ara', value:'find' },
        { name:'Geri', value:'back' }
      ]
    }]);
    if (op==='back') return;
    if (op==='set') {
      const a = await inquirer.prompt([
        { type:'input', name:'key', message:'Anahtar kelime:' },
        { type:'input', name:'vals', message:'Eş anlamlılar (virgüllü):' }
      ]);
      s.synonyms[a.key] = a.vals.split(',').map(x=>x.trim()).filter(Boolean);
      await writeStore(s); console.log(ok('Kaydedildi.'));
    }
    if (op==='list') Object.entries(s.synonyms).forEach(([k,v])=>console.log(`${ok(k)}: ${v.join(', ')}`));
    if (op==='del') { const { key } = await inquirer.prompt([{ type:'input', name:'key', message:'Silinecek anahtar:' }]); delete s.synonyms[key]; await writeStore(s); console.log(ok('Silindi.')); }
    if (op==='find') { const { key } = await inquirer.prompt([{ type:'input', name:'key', message:'Ara:' }]); console.log(s.synonyms[key] ? s.synonyms[key].join(', ') : warn('Bulunamadı.')); }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4) Ekran görüntüsü al + OCR ile betimle
  async function screenshotDescribeMenu() {
    const out = path.join(TMP, `shot-${Date.now()}.png`);
    try {
      if (isMac()) await exec(`screencapture -x "${out}"`);
      else if (isWindows()) {
        const ps = `
Add-Type -AssemblyName System.Windows.Forms;
Add-Type -AssemblyName System.Drawing;
$bmp = New-Object Drawing.Bitmap([System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width, [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height);
$gr = [System.Drawing.Graphics]::FromImage($bmp);
$gr.CopyFromScreen([System.Drawing.Point]::new(0,0), [System.Drawing.Point]::new(0,0), $bmp.Size);
$bmp.Save('${out.replace(/\\/g,'\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png);`;
        await exec(`powershell -NoProfile -Command "${ps.replace(/\n/g,';')}"`);
      } else {
        try { await exec(`gnome-screenshot -f "${out}"`); }
        catch { await exec(`import -window root "${out}"`); }
      }
      console.log(ok('Ekran görüntüsü: ' + out));
    } catch (e) { console.log(err('Ekran görüntüsü alınamadı: ' + e.message)); return; }

    const ocr = await runTesseract(out);
    if (ocr) {
      const summary = ocr.split(/\s+/).slice(0,80).join(' ');
      console.log(title('OCR Metin (kısaltılmış):')); console.log(summary); printDivider();
    } else {
      console.log(warn('OCR yapılamadı (tesseract?).'));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5) Kullanıcı profili (yerel)
  async function userProfileMenu() {
    const s = await readStore(); s.profile ||= {};
    const fields = [
      ['name','Adı'], ['dob','Doğum tarihi (ISO)'], ['pob','Doğum yeri'],
      ['work','Çalıştığı yer'], ['nick','Lakabı'], ['email','E-posta'],
      ['phone','Telefon'], ['address','Ev adresi']
    ];
    const { op } = await inquirer.prompt([{ type:'list', name:'op', message:'Profil:', choices:['Güncelle','Görüntüle','Sil','Geri'] }]);
    if (op==='Geri') return;
    if (op==='Güncelle') {
      const ans = {};
      for (const [k,label] of fields) {
        const a = await inquirer.prompt([{ type:'input', name:k, message:label+':', default: s.profile[k] || '' }]);
        ans[k] = a[k];
      }
      s.profile = ans; await writeStore(s); console.log(ok('Kaydedildi.'));
    }
    if (op==='Görüntüle') { console.log(title('Kullanıcı Profili')); Object.entries(s.profile).forEach(([k,v])=>console.log(`${ok(k)}: ${v||'-'}`)); }
    if (op==='Sil') { s.profile={}; await writeStore(s); console.log(ok('Temizlendi.')); }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6) Sesli not (mikrofondan)
  async function voiceNotesMenu() {
    const haveFF = await hasCmd('ffmpeg'); if (!haveFF) { console.log(err('ffmpeg gerekli.')); return; }
    const { secs } = await inquirer.prompt([{ type:'number', name:'secs', message:'Süre (sn):', default:30 }]);
    const dir = path.join(BASE, 'voice-notes'); await fs.ensureDir(dir);
    const out = path.join(dir, `note-${Date.now()}.m4a`);
    try {
      if (isMac()) await exec(`ffmpeg -f avfoundation -i ":0" -t ${secs} -y "${out}"`);
      else if (isWindows()) await exec(`ffmpeg -f dshow -i audio="virtual-audio-capturer" -t ${secs} -y "${out}"`);
      else await exec(`ffmpeg -f alsa -i default -t ${secs} -y "${out}"`);
      console.log(ok('Kaydedildi: ' + out));
    } catch (e) { console.log(err('Kayıt hatası: ' + e.message)); }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7) Kamera video kaydı
  async function cameraVideoMenu() {
    const haveFF = await hasCmd('ffmpeg'); if (!haveFF) { console.log(err('ffmpeg gerekli.')); return; }
    const { secs } = await inquirer.prompt([{ type:'number', name:'secs', message:'Süre (sn):', default:10 }]);
    const dir = path.join(BASE, 'camera'); await fs.ensureDir(dir);
    const out = path.join(dir, `video-${Date.now()}.mp4`);
    try {
      if (isMac()) await exec(`ffmpeg -f avfoundation -framerate 30 -i "0" -t ${secs} -y "${out}"`);
      else if (isWindows()) await exec(`ffmpeg -f dshow -i video="Integrated Camera" -t ${secs} -y "${out}"`);
      else await exec(`ffmpeg -f v4l2 -i /dev/video0 -t ${secs} -y "${out}"`);
      console.log(ok('Video kaydedildi: ' + out));
    } catch (e) { console.log(err('Kamera/video hatası: ' + e.message)); }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8) Kamera fotoğraf
  async function cameraPhotoMenu() {
    const haveFF = await hasCmd('ffmpeg'); if (!haveFF) { console.log(err('ffmpeg gerekli.')); return; }
    const dir = path.join(BASE, 'camera'); await fs.ensureDir(dir);
    const out = path.join(dir, `photo-${Date.now()}.jpg`);
    try {
      if (isMac()) await exec(`ffmpeg -f avfoundation -i "0" -frames:v 1 -y "${out}"`);
      else if (isWindows()) await exec(`ffmpeg -f dshow -i video="Integrated Camera" -frames:v 1 -y "${out}"`);
      else await exec(`ffmpeg -f v4l2 -i /dev/video0 -frames:v 1 -y "${out}"`);
      console.log(ok('Fotoğraf: ' + out));
    } catch (e) { console.log(err('Kamera/fotoğraf hatası: ' + e.message)); }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 9) Web sayfası bölüm izleme (regex)
  async function pageWatchMenu() {
    const a = await inquirer.prompt([
      { type:'input', name:'url', message:'URL:' },
      { type:'input', name:'needle', message:'İzlenecek ifade/regex (ör: Fiyat: \\d+₺):' },
      { type:'number', name:'sec', message:'Kontrol sıklığı (sn):', default:60 }
    ]);
    console.log(dim('Ctrl+C ile durdurabilirsin.'));
    let last = '';
    while (true) {
      try {
        const html = await curl(a.url, { 'Accept':'text/html' }, 20);
        const txt = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        const rgx = new RegExp(a.needle, 'i');
        const found = (txt.match(rgx) || [''])[0];
        const hash = (Buffer.from(found).toString('base64'));
        if (last && hash !== last) {
          console.log(ok('🔔 Değişiklik algılandı:'), (found||'(boş)').slice(0,200));
          process.stdout.write('\x07'); await ttsSay('Sayfada değişiklik var');
        }
        last = hash;
      } catch (e) { console.log(warn('Erişim hatası: ' + e.message)); }
      await sleep(a.sec*1000);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 10) Trafik linkleri (Google/Yandex/Apple Maps)
  async function trafficLinksMenu() {
    const a = await inquirer.prompt([
      { type:'list', name:'svc', message:'Servis:', choices:['Google Maps','Yandex Maps','Apple Maps'] },
      { type:'input', name:'loc', message:'İl/ilçe/mahalle:' }
    ]);
    const q = encodeURIComponent(a.loc);
    let url = '';
    if (a.svc==='Google Maps') url = `https://www.google.com/maps/search/?api=1&query=${q}&layer=t`;
    if (a.svc==='Yandex Maps')  url = `https://yandex.com.tr/harita/?text=${q}&l=trf%2Ctrfe`;
    if (a.svc==='Apple Maps')   url = `https://maps.apple.com/?q=${q}`;
    console.log(ok(url));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 11) Telegram kolaylıkları
  async function telegramMenu() {
    const { op } = await inquirer.prompt([{
      type:'list', name:'op', message:'Telegram:',
      choices:[
        { name:'Bir kişiye mesaj (derin bağlantı ile)', value:'link' },
        { name:'Sohbetleri listele (telegram-cli)', value:'list' },
        { name:'Bir sohbette son N mesajı oku (telegram-cli)', value:'read' },
        { name:'Geri', value:'back' }
      ]
    }]); if (op==='back') return;

    if (op==='link') {
      const a = await inquirer.prompt([
        { type:'input', name:'to', message:'Kullanıcı adı (@kullanici):' },
        { type:'input', name:'text', message:'Mesaj:' }
      ]);
      const link = `https://t.me/${a.to.replace(/^@/,'')}?text=${encodeURIComponent(a.text)}`;
      console.log(ok(link)); return;
    }
    const haveTG = await hasCmd('telegram-cli') || await hasCmd('tg');
    if (!haveTG) { console.log(err('telegram-cli/tg yüklü değil.')); return; }
    if (op==='list') {
      try { const { stdout } = await exec(`telegram-cli -W -e "dialog_list"`); console.log(title('Sohbetler (ham, ilk 2000):')); console.log(trunc(stdout,2000)); }
      catch (e){ console.log(err('Listeleme hatası: ' + e.message)); }
    }
    if (op==='read') {
      const a = await inquirer.prompt([{ type:'input', name:'dialog', message:'Sohbet adı/kullanıcı:' }, { type:'number', name:'n', message:'Kaç mesaj?', default:20 }]);
      try { const { stdout } = await exec(`telegram-cli -W -e "history ${a.dialog} ${a.n}"`); console.log(title('Mesajlar (ilk 2000):')); console.log(trunc(stdout,2000)); }
      catch (e){ console.log(err('Okuma hatası: ' + e.message)); }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 12) Ses dosyasından transkript
  async function transcribeAudioMenu() {
    const { f } = await inquirer.prompt([{ type:'input', name:'f', message:'Ses dosyası (wav/mp3/m4a):' }]);
    const text = await transcribeFile(f);
    if (text) console.log(ok('Transkript (ilk 2KB):\n') + trunc(text, 2000));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 13) Takvim CRUD + hatırlatıcı
  async function calendarCRUDMenu() {
    const s = await readStore(); s.events ||= [];
    const { op } = await inquirer.prompt([{
      type:'list', name:'op', message:'Takvim:',
      choices:['Oluştur','Listele','Düzenle','Sil','Hatırlat ayarla','Geri']
    }]);
    if (op==='Geri') return;

    if (op==='Oluştur') {
      const a = await inquirer.prompt([
        { type:'input', name:'summary', message:'Başlık:' },
        { type:'input', name:'start', message:'Başlangıç ISO:' },
        { type:'number', name:'dur', message:'Süre (dk):', default:60 },
        { type:'input', name:'location', message:'Yer (opsiyonel):' },
        { type:'editor', name:'desc', message:'Açıklama:' }
      ]);
      const id = 'ev-' + Date.now();
      const startISO = DateTime.fromISO(a.start).toISO();
      const endISO = DateTime.fromISO(a.start).plus({ minutes:a.dur||60 }).toISO();
      s.events.push({ id, summary:a.summary, startISO, endISO, location:a.location, desc:a.desc });
      await writeStore(s); console.log(ok('Oluşturuldu #' + id)); return;
    }
    if (op==='Listele') {
      const t = new Table({ head:['ID','Başlık','Başlangıç','Bitiş','Yer'] });
      (s.events||[]).forEach(e=>t.push([e.id, e.summary, e.startISO, e.endISO, e.location||'']));
      console.log(t.toString()); return;
    }
    if (op==='Düzenle') {
      const { id } = await inquirer.prompt([{ type:'input', name:'id', message:'ID:' }]);
      const e = (s.events||[]).find(x=>x.id===id); if (!e){ console.log(err('Bulunamadı.')); return; }
      const a = await inquirer.prompt([
        { type:'input', name:'summary', message:'Başlık:', default:e.summary },
        { type:'input', name:'start', message:'Başlangıç ISO:', default:e.startISO },
        { type:'input', name:'end', message:'Bitiş ISO:', default:e.endISO },
        { type:'input', name:'location', message:'Yer:', default:e.location||'' },
        { type:'editor', name:'desc', message:'Açıklama:', default:e.desc||'' }
      ]);
      Object.assign(e, { summary:a.summary, startISO:a.start, endISO:a.end, location:a.location, desc:a.desc });
      await writeStore(s); console.log(ok('Güncellendi.')); return;
    }
    if (op==='Sil') {
      const { id } = await inquirer.prompt([{ type:'input', name:'id', message:'ID:' }]);
      const i = (s.events||[]).findIndex(x=>x.id===id);
      if (i>=0){ s.events.splice(i,1); await writeStore(s); console.log(ok('Silindi.')); } else console.log(err('Bulunamadı.'));
      return;
    }
    if (op==='Hatırlat ayarla') {
      const { id, before } = await inquirer.prompt([
        { type:'input', name:'id', message:'Etkinlik ID:' },
        { type:'number', name:'before', message:'Kaç dk önce hatırlat?', default:10 }
      ]);
      const e = (s.events||[]).find(x=>x.id===id); if (!e){ console.log(err('Bulunamadı.')); return; }
      const when = DateTime.fromISO(e.startISO).minus({ minutes:before }).toISO();
      s.alarms ||= [];
      const aid = 'cal-' + Date.now();
      s.alarms.push({ id: aid, type:'alarm', message:`Etkinlik: ${e.summary}`, when });
      await writeStore(s);
      console.log(ok(`Hatırlatıcı planlandı: ${when}`));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 14) Office belge üretimi (LibreOffice varsa .docx/.xlsx/.pptx)
  async function officeGeneratorMenu() {
    const { kind } = await inquirer.prompt([{ type:'list', name:'kind', message:'Belge türü:', choices:['Word (.docx)','Excel (.xlsx)','PowerPoint (.pptx)'] }]);
    const { titleText } = await inquirer.prompt([{ type:'input', name:'titleText', message:'Başlık/kapak metni:' }]);
    const outDir = path.join(BASE, 'documents'); await fs.ensureDir(outDir);

    function escapeHtml(s){ return String(s).replace(/[&<>"]/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m])); }
    async function convertWithSoffice(src, out) {
      const have = await hasCmd('soffice');
      if (!have) { await fs.copyFile(src, out.replace(/\.(docx|xlsx|pptx)$/i, '.html')); console.log(warn('LibreOffice yok; HTML/CSV yedek çıktı verildi.')); return; }
      try {
        await exec(`soffice --headless --convert-to ${path.extname(out).slice(1)} --outdir "${path.dirname(out)}" "${src}"`);
        const produced = path.join(path.dirname(out), path.basename(src).replace(/\.\w+$/, path.extname(out)));
        if (await fs.pathExists(produced)) await fs.rename(produced, out);
      } catch (e) { console.log(err('LibreOffice dönüştürme hatası: ' + e.message)); }
    }

    if (kind.startsWith('Word')) {
      const html = `<!doctype html><meta charset="utf-8"><h1>${escapeHtml(titleText)}</h1><p>${new Date()}</p>`;
      const src = path.join(TMP, 'doc.html'); await fs.writeFile(src, html, 'utf8');
      const out = path.join(outDir, `doc-${Date.now()}.docx`);
      await convertWithSoffice(src, out); console.log(ok('Oluşturuldu: ' + out));
    } else if (kind.startsWith('Excel')) {
      const csv = `Başlık,Değer\nZaman,${new Date().toISOString()}\nNot,${titleText}\n`;
      const src = path.join(TMP, 'sheet.csv'); await fs.writeFile(src, csv, 'utf8');
      const out = path.join(outDir, `sheet-${Date.now()}.xlsx`);
      await convertWithSoffice(src, out); console.log(ok('Oluşturuldu: ' + out));
    } else {
      const html = `<!doctype html><meta charset="utf-8"><h1>${escapeHtml(titleText)}</h1><h2>botyum sunum</h2>`;
      const src = path.join(TMP, 'slides.html'); await fs.writeFile(src, html, 'utf8');
      const out = path.join(outDir, `slides-${Date.now()}.pptx`);
      await convertWithSoffice(src, out); console.log(ok('Oluşturuldu: ' + out));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 15) Hızlı metin dosyası
  async function quickTextMenu() {
    const dir = path.join(BASE, 'documents'); await fs.ensureDir(dir);
    const { name, body } = await inquirer.prompt([
      { type:'input', name:'name', message:'Dosya adı (uzantısız):', default:`note-${Date.now()}` },
      { type:'editor', name:'body', message:'Metin (editörde):' }
    ]);
    const f = path.join(dir, `${name}.txt`); await fs.writeFile(f, body||'', 'utf8');
    console.log(ok('Oluşturuldu: ' + f));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 16) documents/ gez ve görüntüle (PDF/Metin)
  async function documentsBrowserMenu() {
    let cur = DOCS;
    while (true) {
      const items = await fs.readdir(cur, { withFileTypes:true });
      const choices = items.map(e=>({ name: e.isDirectory()? `📁 ${e.name}` : `📄 ${e.name}`, value: e.name }))
        .concat([{ name:'⬆️ ..', value:'..' }, { name:'Çık', value:'exit' }]);
      const { pick } = await inquirer.prompt([{ type:'list', name:'pick', message:`Dizin: ${cur}`, pageSize:20, choices }]);
      if (pick==='exit') return;
      if (pick==='..') { const up = path.dirname(cur); if (up.startsWith(DOCS)) cur = up; else cur = DOCS; continue; }
      const full = path.join(cur, pick);
      const stat = await fs.stat(full);
      if (stat.isDirectory()) { cur = full; continue; }
      // dosya içerik
      let content = '';
      try {
        if (/\.(pdf)$/i.test(full)) {
          try {
            const { default: pdfParse } = await import('pdf-parse');
            const data = await pdfParse(await fs.readFile(full));
            content = data.text;
          } catch { content = '(PDF okumak için pdf-parse gerekli.)'; }
        } else {
          content = await fs.readFile(full, 'utf8');
        }
      } catch { content = '(Okunamadı)'; }
      console.log(title(full)); console.log(trunc(content, 5000)); printDivider();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 17) Belgelerde anahtar kelime arama (txt/pdf/docx basit)
  async function documentsSearchMenu() {
    const { kw } = await inquirer.prompt([{ type:'input', name:'kw', message:'Anahtar kelime:' }]);
    const files = await walkFiles(DOCS);
    for (const f of files) {
      let text = '';
      try {
        if (/\.pdf$/i.test(f)) {
          try { const { default: pdfParse } = await import('pdf-parse'); const data = await pdfParse(await fs.readFile(f)); text = data.text || ''; }
          catch {}
        } else if (/\.txt$|\.md$|\.csv$/i.test(f)) {
          text = await fs.readFile(f, 'utf8');
        } else if (/\.docx$/i.test(f)) {
          try {
            const haveUnzip = await hasCmd('unzip');
            if (haveUnzip) { const { stdout } = await exec(`unzip -p "${f}" word/document.xml`); text = stdout.replace(/<[^>]+>/g,' '); }
          } catch {}
        }
      } catch {}
      if (!text) continue;
      const lines = text.split(/\r?\n/);
      lines.forEach((ln, idx)=>{ if (ln.toLowerCase().includes(kw.toLowerCase())) { console.log(ok(`${f}:${idx+1}`)); console.log('  ' + ln.slice(0,200)); } });
    }
    printDivider();
  }
  async function walkFiles(dir, out=[]) {
    const ents = await fs.readdir(dir, { withFileTypes:true });
    for (const e of ents) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walkFiles(full, out); else out.push(full);
    }
    return out;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 18) PDF/Resim OCR
  async function ocrMenu() {
    const { f } = await inquirer.prompt([{ type:'input', name:'f', message:'PDF veya resim dosyası:' }]);
    const have = await hasCmd('tesseract');
    if (!have) { console.log(err('tesseract gerekli.')); return; }
    if (/\.pdf$/i.test(f)) {
      try {
        const okPoppler = await hasCmd('pdftoppm');
        const base = path.join(TMP, `ocrpdf-${Date.now()}`);
        if (okPoppler) {
          await exec(`pdftoppm "${f}" "${base}" -singlefile -png`);
          const txt = await runTesseract(`${base}.png`);
          console.log(title('OCR metin (ilk 3000):')); console.log(trunc(txt, 3000));
        } else {
          const txt = await runTesseract(f);
          console.log(title('OCR metin (ilk 3000):')); console.log(trunc(txt, 3000));
        }
      } catch (e) { console.log(err('OCR/pdftoppm hatası: ' + e.message)); }
    } else {
      const txt = await runTesseract(f);
      console.log(title('OCR metin (ilk 3000):')); console.log(trunc(txt, 3000));
    }
    printDivider();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 19) Issues: Azure Boards / Jira / GitHub / Trello
  async function issuesMenu() {
    const { svc } = await inquirer.prompt([{ type:'list', name:'svc', message:'Hizmet:', choices:['Azure Boards','Jira','GitHub Issues','Trello'] }]);

    if (svc==='GitHub Issues') {
      const a = await inquirer.prompt([
        { type:'input', name:'q', message:'Arama (örn: repo:owner/name is:issue is:open bug):' },
        { type:'input', name:'token', message:'GitHub token (opsiyonel):', default: process.env.GITHUB_TOKEN || '' }
      ]);
      try {
        const j = JSON.parse(await curl(`https://api.github.com/search/issues?q=${encodeURIComponent(a.q)}`,
          { 'Accept':'application/vnd.github+json', ...(a.token?{Authorization:`Bearer ${a.token}`}:{}) }, 20));
        (j.items||[]).slice(0,10).forEach(it=>console.log(`${ok('#'+it.number)} ${it.title}\n  ${dim(it.html_url)}`));
      } catch (e) { console.log(err('GitHub hatası: ' + e.message)); }
      return;
    }

    if (svc==='Jira') {
      const a = await inquirer.prompt([
        { type:'input', name:'base', message:'Jira base URL (https://org.atlassian.net):' },
        { type:'input', name:'email', message:'E-posta:' },
        { type:'password', name:'token', message:'API token:' },
        { type:'input', name:'jql', message:'JQL (örn: project=ABC AND status="To Do"):' }
      ]);
      try {
        const j = JSON.parse(await curl(`${a.base.replace(/\/$/,'')}/rest/api/2/search?jql=${encodeURIComponent(a.jql)}`,
          { 'Accept':'application/json', 'Authorization':'Basic ' + Buffer.from(`${a.email}:${a.token}`).toString('base64') }, 20));
        (j.issues||[]).slice(0,10).forEach(it=>console.log(`${ok(it.key)} ${it.fields.summary}`));
      } catch (e) { console.log(err('Jira hatası: ' + e.message)); }
      return;
    }

    if (svc==='Trello') {
      const a = await inquirer.prompt([
        { type:'input', name:'key', message:'Trello key:', default: process.env.TRELLO_KEY || '' },
        { type:'input', name:'token', message:'Trello token:', default: process.env.TRELLO_TOKEN || '' },
        { type:'input', name:'q', message:'Arama (kart/board):' }
      ]);
      try {
        const j = JSON.parse(await curl(`https://api.trello.com/1/search?query=${encodeURIComponent(a.q)}&key=${a.key}&token=${a.token}`,
          { 'Accept':'application/json' }, 20));
        (j.cards||[]).slice(0,10).forEach(c=>console.log(`${ok(c.name)} (${c.idShort})\n  ${dim(c.shortUrl)}`));
      } catch (e) { console.log(err('Trello hatası: ' + e.message)); }
      return;
    }

    if (svc==='Azure Boards') {
      const a = await inquirer.prompt([
        { type:'input', name:'org', message:'Org (dev.azure.com/{org}):' },
        { type:'input', name:'project', message:'Project:' },
        { type:'password', name:'pat', message:'PAT:' },
        { type:'input', name:'wiql', message:'WIQL sorgu:' }
      ]);
      try {
        const wiqlBody = JSON.stringify({ query: a.wiql });
        const wiqlRes = JSON.parse(await curl(`https://dev.azure.com/${a.org}/${a.project}/_apis/wit/wiql?api-version=7.0`,
          { 'Content-Type':'application/json', 'Authorization':'Basic ' + Buffer.from(':'+a.pat).toString('base64') }, 20, 'POST', wiqlBody));
        const ids = (wiqlRes.workItems||[]).slice(0,10).map(w=>w.id).join(',');
        if (!ids) { console.log(warn('Kayıt yok.')); return; }
        const items = JSON.parse(await curl(`https://dev.azure.com/${a.org}/${a.project}/_apis/wit/workitems?ids=${ids}&api-version=7.0`,
          { 'Authorization':'Basic ' + Buffer.from(':'+a.pat).toString('base64') }, 20));
        (items.value||[]).forEach(it=>console.log(`${ok('#'+it.id)} ${it.fields['System.Title']}`));
      } catch (e) { console.log(err('Azure Boards hatası: ' + e.message)); }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 20) Quora arama + özet
  async function quoraMenu() {
    const { q } = await inquirer.prompt([{ type:'input', name:'q', message:'Anahtar kelime(ler):' }]);
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('site:quora.com ' + q)}`;
      const html = await curl(url, { 'Accept':'text/html' }, 20);
      const res = parseDDG(html);
      if (!res.length) { console.log(warn('Sonuç yok.')); return; }
      console.log(title('Quora Sonuçları')); res.slice(0,10).forEach((r,i)=>console.log(`${ok(String(i+1).padStart(2,'0'))}) ${r.title}\n   ${dim(r.url)}`));
      printDivider();
      const { idx } = await inquirer.prompt([{ type:'number', name:'idx', message:'Özetlenecek # (boş: geç):', default: 0 }]);
      if (idx>0) {
        const pick = res[idx-1]; if (!pick) return;
        const page = await curl(pick.url, { 'Accept':'text/html' }, 20);
        const txt = page.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        console.log(title('Sayfa Özeti (ilk 2000):')); console.log(trunc(txt,2000));
      }
    } catch (e) { console.log(err('Arama hata: ' + e.message)); }
  }
  function parseDDG(html) {
    const out = []; const rx=/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gsi;
    let m,i=1; while((m=rx.exec(html))!==null){ const url=m[1]; const title=m[2].replace(/<[^>]+>/g,'').trim(); if(title&&url) out.push({i:i++,title,url}); if(out.length>=20) break; }
    return out;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 21) Reddit gönderi/yorumları
  async function redditMenu() {
    const { q } = await inquirer.prompt([{ type:'input', name:'q', message:'Anahtar kelime(ler):' }]);
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('site:reddit.com ' + q)}`;
      const html = await curl(url, { 'Accept':'text/html' }, 20);
      const res = parseDDG(html);
      if (!res.length) { console.log(warn('Sonuç yok.')); return; }
      console.log(title('Reddit Sonuçları'));
      res.slice(0,10).forEach((r,i)=>console.log(`${ok(String(i+1).padStart(2,'0'))}) ${r.title}\n   ${dim(r.url)}`));
      const { idx } = await inquirer.prompt([{ type:'number', name:'idx', message:'Yorumları çekilecek # (boş: geç):', default: 0 }]);
      if (idx>0) {
        let u = res[idx-1].url;
        if (!/\.json$/.test(u)) u = u.replace(/\/?$/,'/.json');
        const j = JSON.parse(await curl(u, { 'Accept':'application/json' }, 20));
        const comments = (j[1]?.data?.children||[]).filter(x=>x.kind==='t1').slice(0,10);
        comments.forEach((c,i)=>console.log(`${ok(String(i+1).padStart(2,'0'))}) ${c.data.author}: ${c.data.body.slice(0,200)}`));
      }
    } catch (e) { console.log(err('Reddit hata: ' + e.message)); }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 22) Slack (kanallar listesi / mesaj gönder/oku)
  async function slackMenu() {
    const s = await readStore(); s.slack ||= { token: process.env.SLACK_TOKEN || '' };
    const { op } = await inquirer.prompt([{
      type:'list', name:'op', message:'Slack:',
      choices:['Token ayarla','Kanalları listele','Kanala mesaj gönder','Kanalda son N mesajı oku','Geri']
    }]);
    if (op==='Geri') return;
    if (op==='Token ayarla') {
      const { token } = await inquirer.prompt([{ type:'password', name:'token', message:'Slack Bot/User OAuth Token (xoxb-.. / xoxp-..):', mask:'*', default: s.slack.token }]);
      s.slack.token = token; await writeStore(s); console.log(ok('Kaydedildi.')); return;
    }
    const token = s.slack.token || process.env.SLACK_TOKEN;
    if (!token) { console.log(err('Önce token ayarla.')); return; }

    if (op==='Kanalları listele') {
      try {
        const j = JSON.parse(await curl(`https://slack.com/api/conversations.list?limit=50`,
          { 'Authorization':'Bearer ' + token, 'Accept':'application/json' }, 20));
        (j.channels||[]).forEach(c=>console.log(`${ok(c.id)} ${c.name} ${dim(c.is_private?'(private)':'')}`));
      } catch (e) { console.log(err('Slack hata: ' + e.message)); }
      return;
    }
    if (op==='Kanala mesaj gönder') {
      const a = await inquirer.prompt([{ type:'input', name:'channel', message:'Kanal ID (C…/G…):' }, { type:'editor', name:'text', message:'Mesaj:' }]);
      try {
        const j = JSON.parse(await curl(`https://slack.com/api/chat.postMessage`,
          { 'Authorization':'Bearer ' + token, 'Content-Type':'application/json' }, 20, 'POST', JSON.stringify({ channel:a.channel, text:a.text })));
        console.log(j.ok ? ok('Gönderildi.') : err('Gönderilemedi: ' + j.error));
      } catch (e) { console.log(err('Slack hata: ' + e.message)); }
      return;
    }
    if (op==='Kanalda son N mesajı oku') {
      const a = await inquirer.prompt([{ type:'input', name:'channel', message:'Kanal ID:' }, { type:'number', name:'n', message:'Kaç mesaj?', default:10 }]);
      try {
        const j = JSON.parse(await curl(`https://slack.com/api/conversations.history?channel=${encodeURIComponent(a.channel)}&limit=${a.n}`,
          { 'Authorization':'Bearer ' + token, 'Accept':'application/json' }, 20));
        (j.messages||[]).forEach((m,i)=>console.log(`${ok(String(i+1).padStart(2,'0'))}) ${m.user||m.username||'-'}: ${trunc(m.text||'', 200)}`));
      } catch (e) { console.log(err('Slack hata: ' + e.message)); }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  return {
    speechToClipboardMenu,
    wakeWordHandsFreeMenu,
    synonymsMenu,
    screenshotDescribeMenu,
    userProfileMenu,
    voiceNotesMenu,
    cameraVideoMenu,
    cameraPhotoMenu,
    pageWatchMenu,
    trafficLinksMenu,
    telegramMenu,
    transcribeAudioMenu,
    calendarCRUDMenu,
    officeGeneratorMenu,
    quickTextMenu,
    documentsBrowserMenu,
    documentsSearchMenu,
    ocrMenu,
    issuesMenu,
    quoraMenu,
    redditMenu,
    slackMenu
  };
}
