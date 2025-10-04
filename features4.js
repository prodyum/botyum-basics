// features4.js
// Daha önce kodlamadıklarımızdan 12 yeni "asistan" özelliği:
// 1) Akıllı Ev / Webhook Tetikleyici (IFTTT / Home Assistant / n8n vb.)
// 2) ICS Etkinlik Oluşturucu (.ics dosyası üret)
// 3) Alışveriş Listesi (kategori destekli, CSV dışa aktarım)
// 4) Ezber Kartları (Leitner / basit SRS)
// 5) Pomodoro Odak Zamanlayıcısı
// 6) QR Kod Üretici (link/metin → QR URL)
// 7) Gün Doğumu/Batımı + Ay Evresi (yaklaşık hesap)
// 8) Güçlü Şifre / Geçiş Kelimesi (passphrase) Üretici
// 9) URL Kısaltıcı (TinyURL)
// 10) Yerel Dosya Bulucu (isim/yaş filtresi)
// 11) Bahşiş & Hesap Bölüşme
// 12) Okunabilirlik Analizi (ARI)
//
// Kullanım: index.js’te modül kaydı yap ve menüden çağır.

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { DateTime } from 'luxon';
import Table from 'cli-table3';

export function registerFeatures4(ctx) {
  // ctx: { inquirer, curl, ok, err, warn, dim, title, printDivider, readStore, writeStore, exec }
  const {
    inquirer, curl, ok, err, warn, dim, title, printDivider,
    readStore, writeStore, exec
  } = ctx;

  // ──────────────────────────────────────────────────────────────────────────
  // Yardımcılar
  const HOME = os.homedir();
  const BASE = path.join(HOME, '.botyum');
  const TMP = path.join(BASE, 'tmp');
  fs.ensureDirSync(BASE); fs.ensureDirSync(TMP);

  function csvEsc(s){ return `"${String(s ?? '').replace(/"/g,'""')}"`; }
  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

  // ──────────────────────────────────────────────────────────────────────────
  // 1) Akıllı Ev / Webhook Tetikleyici
  async function smartHomeWebhookMenu() {
    const s = await readStore();
    s.settings ||= {};
    s.settings.webhooks ||= {}; // { default_base, token }
    const { op } = await inquirer.prompt([{
      type:'list', name:'op', message:'Webhook:',
      choices:[
        { name:'Webhook gönder', value:'send' },
        { name:'Varsayılan taban URL / token ayarla', value:'cfg' },
        { name:'Geri', value:'back' }
      ]
    }]);
    if (op==='back') return;

    if (op==='cfg') {
      const a = await inquirer.prompt([
        { type:'input', name:'base', message:'Varsayılan webhook taban URL:', default: s.settings.webhooks.default_base || '' },
        { type:'input', name:'token', message:'Varsayılan gizli anahtar/token (opsiyonel):', default: s.settings.webhooks.token || '' }
      ]);
      s.settings.webhooks.default_base = a.base;
      s.settings.webhooks.token = a.token;
      await writeStore(s);
      console.log(ok('Kaydedildi.'));
      return;
    }

    if (op==='send') {
      const a = await inquirer.prompt([
        { type:'input', name:'url', message:'Tam webhook URL (boşsa taban + event):', default:'' },
        { type:'input', name:'event', message:'Etkinlik adı (taban kullanılıyorsa):', default:'toggle' },
        { type:'list', name:'method', message:'HTTP yöntemi:', choices:['POST','GET'], default:'POST' },
        { type:'editor', name:'payload', message:'JSON payload (opsiyonel):' }
      ]);
      const base = s.settings.webhooks.default_base || '';
      const token = s.settings.webhooks.token ? `/${encodeURIComponent(s.settings.webhooks.token)}` : '';
      let url = a.url.trim();
      if (!url) {
        if (!base) { console.log(err('Varsayılan taban URL yok. "cfg" ile ayarla.')); return; }
        url = `${base.replace(/\/+$/,'')}/${encodeURIComponent(a.event)}${token}`;
      }
      try {
        const isPost = a.method === 'POST';
        const body = (a.payload && a.payload.trim()) ? a.payload : null;
        const res = await curl(url, { 'Content-Type':'application/json', 'Accept':'application/json' }, 20, isPost ? 'POST' : 'GET', body);
        console.log(title('Webhook yanıtı (ilk 2KB):'));
        console.log((res || '').slice(0, 2048) || dim('(boş)'));
      } catch (e) {
        console.log(err('Gönderilemedi: ' + e.message));
      }
      printDivider();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2) ICS Etkinlik Oluşturucu
  async function icsEventCreatorMenu() {
    const a = await inquirer.prompt([
      { type:'input', name:'summary', message:'Başlık:' },
      { type:'input', name:'start', message:'Başlangıç (ISO, ör: 2025-12-01T14:00):' },
      { type:'number', name:'dur', message:'Süre (dakika):', default:60 },
      { type:'input', name:'location', message:'Yer (opsiyonel):', default:'' },
      { type:'editor', name:'desc', message:'Açıklama (opsiyonel):' }
    ]);
    const dtStart = DateTime.fromISO(a.start, { setZone:true });
    if (!dtStart.isValid) { console.log(err('Geçersiz başlangıç.')); return; }
    const dtEnd = dtStart.plus({ minutes: a.dur || 60 });
    const uid = crypto.randomUUID() + '@botyum';
    const fmt = (dt) => dt.toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//botyum-basics//features4//TR',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${fmt(DateTime.utc())}`,
      `DTSTART:${fmt(dtStart)}`,
      `DTEND:${fmt(dtEnd)}`,
      `SUMMARY:${escapeICS(a.summary || '')}`,
      a.location ? `LOCATION:${escapeICS(a.location)}` : '',
      a.desc ? `DESCRIPTION:${escapeICS(a.desc)}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
    const outDir = path.join(HOME, '.botyum', 'events');
    await fs.ensureDir(outDir);
    const outPath = path.join(outDir, `event-${Date.now()}.ics`);
    await fs.writeFile(outPath, ics, 'utf8');
    console.log(ok('Oluşturuldu: ' + outPath));
    printDivider();
  }
  function escapeICS(s) {
    return String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3) Alışveriş Listesi
  async function shoppingListMenu() {
    const s = await readStore();
    s.shopping ||= []; // {title, cat, qty, done}
    const { op } = await inquirer.prompt([{
      type:'list', name:'op', message:'Alışveriş Listesi:',
      choices:[
        { name:'Ekle', value:'add' },
        { name:'Listele', value:'list' },
        { name:'Tamamla/geri al', value:'toggle' },
        { name:'Sil', value:'del' },
        { name:'CSV dışa aktar', value:'csv' },
        { name:'Geri', value:'back' }
      ]
    }]);
    if (op==='back') return;

    if (op==='add') {
      const a = await inquirer.prompt([
        { type:'input', name:'title', message:'Ürün:' },
        { type:'input', name:'cat', message:'Kategori:', default:'Genel' },
        { type:'input', name:'qty', message:'Adet/Birim:', default:'1' }
      ]);
      s.shopping.push({ title:a.title, cat:a.cat, qty:a.qty, done:false, ts:DateTime.now().toISO() });
      await writeStore(s); console.log(ok('Eklendi.'));
    }
    if (op==='list') {
      const t = new Table({ head:['#','Durum','Ürün','Adet','Kategori'] });
      s.shopping.forEach((it,i)=>t.push([i+1, it.done?'✓':' ', it.title, it.qty, it.cat]));
      console.log(title('Alışveriş Listesi')); console.log(t.toString()); printDivider();
    }
    if (op==='toggle') {
      const { idx } = await inquirer.prompt([{ type:'number', name:'idx', message:'Sıra #:' }]);
      if (s.shopping[idx-1]) { s.shopping[idx-1].done = !s.shopping[idx-1].done; await writeStore(s); console.log(ok('Güncellendi.')); }
      else console.log(err('Bulunamadı.'));
    }
    if (op==='del') {
      const { idx } = await inquirer.prompt([{ type:'number', name:'idx', message:'Silinecek #:' }]);
      if (s.shopping[idx-1]) { s.shopping.splice(idx-1,1); await writeStore(s); console.log(ok('Silindi.')); }
      else console.log(err('Bulunamadı.'));
    }
    if (op==='csv') {
      const outDir = path.join(HOME, '.botyum', 'exports');
      await fs.ensureDir(outDir);
      const outPath = path.join(outDir, `shopping-${Date.now()}.csv`);
      const lines = ['title,qty,cat,done,ts'].concat(s.shopping.map(it=>[
        csvEsc(it.title), csvEsc(it.qty), csvEsc(it.cat), it.done?'1':'0', it.ts || ''
      ].join(',')));
      await fs.writeFile(outPath, lines.join('\n'), 'utf8');
      console.log(ok('Dışa aktarıldı: ' + outPath));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4) Ezber Kartları (Leitner)
  async function flashcardsMenu() {
    const s = await readStore();
    s.flash ||= { decks: {} }; // decks[deckName] = [{q,a,box}]
    const { op } = await inquirer.prompt([{
      type:'list', name:'op', message:'Ezber Kartları:',
      choices:[
        { name:'Deste seç/oluştur', value:'deck' },
        { name:'Çalış (Leitner turu)', value:'study' },
        { name:'Deste sil', value:'del' },
        { name:'Geri', value:'back' }
      ]
    }]);
    if (op==='back') return;

    if (op==='deck') {
      const a = await inquirer.prompt([
        { type:'input', name:'name', message:'Deste adı:' },
        { type:'list', name:'action', message:'Ne yapalım?', choices:['Kart ekle','Kartları listele'] }
      ]);
      s.flash.decks[a.name] ||= [];
      if (a.action==='Kart ekle') {
        const k = await inquirer.prompt([
          { type:'editor', name:'q', message:'Soru/Ön yüz:' },
          { type:'editor', name:'a', message:'Cevap/Arka yüz:' }
        ]);
        s.flash.decks[a.name].push({ q:k.q, a:k.a, box:1, ts:DateTime.now().toISO() });
        await writeStore(s); console.log(ok('Kart eklendi.'));
      } else {
        const deck = s.flash.decks[a.name];
        const t = new Table({ head:['#','Kutu','Ön (ilk satır)'] });
        deck.forEach((c,i)=>t.push([i+1, c.box, (c.q.split('\n')[0]||'').slice(0,50)]));
        console.log(title(`Deste: ${a.name}`)); console.log(t.toString()); printDivider();
      }
    }
    if (op==='study') {
      const { name } = await inquirer.prompt([{ type:'input', name:'name', message:'Deste adı:' }]);
      const deck = s.flash.decks[name] || [];
      if (!deck.length) { console.log(warn('Bu destede kart yok.')); return; }
      const pool = [...deck].sort((A,B)=>A.box - B.box);
      for (const card of pool.slice(0,20)) {
        console.log(title('ÖN:')); console.log(card.q);
        await inquirer.prompt([{ type:'input', name:'_c', message: dim('(devam için Enter)') }]);
        console.log(ok('ARKA:')); console.log(card.a);
        const { res } = await inquirer.prompt([{ type:'list', name:'res', message:'Bildiğinizi değerlendirin:', choices:['Bilemedim','Zorlandım','Bildim'] }]);
        if (res==='Bildim' && card.box < 5) card.box++;
        if (res==='Bilemedim' && card.box > 1) card.box = 1;
        card.ts = DateTime.now().toISO();
      }
      await writeStore(s); console.log(ok('Çalışma kaydedildi.'));
    }
    if (op==='del') {
      const { name } = await inquirer.prompt([{ type:'input', name:'name', message:'Silinecek deste adı:' }]);
      if (s.flash.decks[name]) { delete s.flash.decks[name]; await writeStore(s); console.log(ok('Silindi.')); }
      else console.log(err('Bulunamadı.'));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5) Pomodoro Odak Zamanlayıcısı
  async function pomodoroMenu() {
    const a = await inquirer.prompt([
      { type:'number', name:'focus', message:'Odak süresi (dk):', default:25 },
      { type:'number', name:'short', message:'Kısa mola (dk):', default:5 },
      { type:'number', name:'cycles', message:'Döngü sayısı:', default:4 }
    ]);
    console.log(title(`Pomodoro: ${a.cycles} x ${a.focus}’ + ${a.short}`));
    for (let i=1; i<=a.cycles; i++) {
      await countdownMinutes(a.focus, `Odak ${i}/${a.cycles}`);
      beep('Odak bitti. Kısa mola!');
      await countdownMinutes(a.short, `Mola ${i}/${a.cycles}`);
      beep('Mola bitti.');
    }
    console.log(ok('Pomodoro tamamlandı.')); printDivider();
  }
  async function countdownMinutes(mins, label) {
    const end = Date.now() + mins*60*1000;
    while (Date.now() < end) {
      const left = Math.ceil((end - Date.now())/1000);
      process.stdout.write(`\r${label}: ${left}s   `);
      await sleep(1000);
    }
    process.stdout.write('\n');
  }
  function beep(msg){ process.stdout.write('\x07'); console.log(ok(msg)); }

  // ──────────────────────────────────────────────────────────────────────────
  // 6) QR Kod Üretici
  async function qrCodeMenu() {
    const a = await inquirer.prompt([
      { type:'input', name:'data', message:'Metin/URL:' },
      { type:'input', name:'size', message:'Boyut (px):', default:'300' }
    ]);
    const link = `https://api.qrserver.com/v1/create-qr-code/?size=${encodeURIComponent(a.size)}x${encodeURIComponent(a.size)}&data=${encodeURIComponent(a.data)}`;
    console.log(title('QR Kodu (görsel URL):'));
    console.log(ok(link)); printDivider();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7) Gündoğumu / Günbatımı + Ay Evresi (yaklaşık)
  async function sunMoonMenu() {
    const a = await inquirer.prompt([{ type:'input', name:'place', message:'Şehir/yer (örn: Ankara):', default:'Ankara' }]);
    try {
      const geo = await curl(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(a.place)}&count=1&language=tr&format=json`, { 'Accept':'application/json' }, 15);
      const gj = JSON.parse(geo);
      if (!gj.results?.length) { console.log(err('Konum bulunamadı.')); return; }
      const loc = gj.results[0];
      const lat = loc.latitude, lon = loc.longitude;
      const ss = await curl(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`, { 'Accept':'application/json' }, 15);
      const j = JSON.parse(ss).results;
      const t = new Table({ head:['Olay','Zaman (yerel)'] });
      const toLocal = (iso)=> DateTime.fromISO(iso).setZone(loc.timezone).toFormat('yyyy-MM-dd HH:mm');
      t.push(['Güneş Doğumu', toLocal(j.sunrise)]);
      t.push(['Güneş Batımı', toLocal(j.sunset)]);
      t.push(['Alacakaranlık (sabah)', toLocal(j.civil_twilight_begin)]);
      t.push(['Alacakaranlık (akşam)', toLocal(j.civil_twilight_end)]);
      console.log(title(`${loc.name} – Güneş olayları`)); console.log(t.toString());

      const phase = moonPhase(DateTime.now());
      console.log(dim(`Ay Evresi (yaklaşık): ${phase.name} — aydınlık: %${phase.illum}`));
      printDivider();
    } catch (e) {
      console.log(err('Bilgi alınamadı: ' + e.message));
    }
  }
  function moonPhase(dt) {
    const lp = 2551443; // new moon -> new moon (s)
    const now = dt.toSeconds();
    const new_moon = Date.UTC(1970,0,7,20,35,0)/1000; // referans
    const phase = ((now - new_moon) % lp + lp) % lp;
    const p = phase / lp; // 0..1
    const illum = Math.round((1 - Math.cos(2*Math.PI*p)) * 50);
    const names = ['Yeni Ay','Hilal','İlk Dördün','Şişkin Ay (waxing)','Dolunay','Küçülen Şişkin','Son Dördün','Sönen Hilal'];
    let idx = Math.floor(p*8) % 8;
    return { frac: p, illum, name: names[idx] };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8) Parola / Passphrase Üretici
  async function passwordGenMenu() {
    const a = await inquirer.prompt([
      { type:'number', name:'len', message:'Uzunluk:', default:16 },
      { type:'confirm', name:'symbols', message:'Semboller kullan?', default:true },
      { type:'confirm', name:'passphrase', message:'Kelime bazlı geçiş cümlesi üret?', default:false }
    ]);
    if (a.passphrase) {
      const words = await randomWords(6);
      console.log(ok(`Geçiş cümlesi: ${words.join('-')}`)); printDivider();
    } else {
      const pwd = randomPassword(a.len, a.symbols);
      console.log(ok(`Şifre: ${pwd}`)); printDivider();
    }
  }
  function randomPassword(len=16, symbols=true) {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const syms = '!@#$%^&*()-_=+[]{};:,.<>?';
    const chars = letters + (symbols ? syms : '');
    const bytes = crypto.randomBytes(len);
    let out = '';
    for (let i=0;i<len;i++) out += chars[bytes[i] % chars.length];
    return out;
  }
  async function randomWords(n=6) {
    const list = ['kedi','martı','deniz','ışık','zaman','yol','bulut','çınar','atlas','ses',
                  'kum','göl','bahar','maestro','güneş','gece','ufuk','gezgin','pamuk','nota',
                  'yaz','kış','bahçe','rüzgar','fener','nehir','ada','kozmos','peri','keşif'];
    const out = [];
    for (let i=0;i<n;i++) out.push(list[crypto.randomInt(0, list.length)]);
    return out;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 9) URL Kısaltıcı (TinyURL)
  async function urlShortenerMenu() {
    const { url } = await inquirer.prompt([{ type:'input', name:'url', message:'Kısaltılacak URL:' }]);
    try {
      const short = await curl(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { 'Accept':'text/plain' }, 15);
      console.log(ok(short.trim()));
    } catch (e) {
      console.log(err('Kısaltma başarısız: ' + e.message));
    }
    printDivider();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 10) Yerel Dosya Bulucu
  async function fileFinderMenu() {
    const a = await inquirer.prompt([
      { type:'input', name:'dir', message:'Klasör:', default: process.cwd() },
      { type:'input', name:'name', message:'İsimde geçmesi gereken ifade (opsiyonel):', default:'' },
      { type:'number', name:'days', message:'Kaç gün içinde değişenler? (0: sınırsız)', default:0 }
    ]);
    try {
      const entries = await fs.readdir(a.dir, { withFileTypes: true });
      const now = Date.now();
      const rows = [];
      for (const ent of entries) {
        if (!ent.isFile()) continue;
        if (a.name && !ent.name.toLowerCase().includes(a.name.toLowerCase())) continue;
        const full = path.join(a.dir, ent.name);
        const st = await fs.stat(full);
        if (a.days>0) {
          const ageDays = (now - st.mtimeMs) / (24*3600*1000);
          if (ageDays > a.days) continue;
        }
        rows.push({ name: ent.name, size: st.size, mtime: st.mtime });
      }
      rows.sort((A,B)=> B.mtime - A.mtime);
      const t = new Table({ head:['Dosya','Boyut (KB)','Değişiklik'] });
      rows.slice(0,30).forEach(r => t.push([r.name, (r.size/1024).toFixed(1), DateTime.fromJSDate(r.mtime).toFormat('yyyy-MM-dd HH:mm')]));
      console.log(title('Dosya Bulucu (ilk 30)')); console.log(t.toString()); printDivider();
    } catch (e) {
      console.log(err('Okuma hatası: ' + e.message));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 11) Bahşiş & Bölüşme
  async function tipSplitMenu() {
    const a = await inquirer.prompt([
      { type:'number', name:'total', message:'Toplam hesap:', default:0 },
      { type:'number', name:'tip', message:'Bahşiş (%)', default:10 },
      { type:'number', name:'people', message:'Kişi sayısı:', default:2 }
    ]);
    const tipAmt = a.total * (a.tip/100);
    const grand = a.total + tipAmt;
    const per = grand / Math.max(1, a.people);
    const t = new Table({ head:['Toplam','Bahşiş','Genel Toplam','Kişi Başı'] });
    t.push([fmtMoney(a.total), fmtMoney(tipAmt), fmtMoney(grand), fmtMoney(per)]);
    console.log(title('Hesap Bölüşme')); console.log(t.toString()); printDivider();
  }
  function fmtMoney(n){ return (Math.round(n*100)/100).toFixed(2); }

  // ──────────────────────────────────────────────────────────────────────────
  // 12) Okunabilirlik (ARI)
  async function readabilityMenu() {
    const { text } = await inquirer.prompt([{ type:'editor', name:'text', message:'Analiz edilecek metin (editörde açılır):' }]);
    const t = (text || '').replace(/\s+/g,' ').trim();
    if (!t) { console.log(err('Boş metin.')); return; }
    const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
    const words = t.split(/\s+/).filter(Boolean);
    const chars = words.join('').length;
    const W = words.length || 1, S = sentences.length || 1, C = chars;
    const ARI = 4.71 * (C / W) + 0.5 * (W / S) - 21.43;
    const tTbl = new Table({ head:['Cümle', 'Kelime', 'Karakter', 'ARI (≈ sınıf)'] });
    tTbl.push([S, W, C, ARI.toFixed(2)]);
    console.log(title('Okunabilirlik Özeti (ARI)')); console.log(tTbl.toString());
    console.log(dim('Not: ARI İngilizce metinler için türetilmiştir; diğer dillerde yaklaşık sonuç verir.'));
    printDivider();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Dışa verilecek menü fonksiyonları
  return {
    smartHomeWebhookMenu,
    icsEventCreatorMenu,
    shoppingListMenu,
    flashcardsMenu,
    pomodoroMenu,
    qrCodeMenu,
    sunMoonMenu,
    passwordGenMenu,
    urlShortenerMenu,
    fileFinderMenu,
    tipSplitMenu,
    readabilityMenu
  };
}
