#!/usr/bin/env node
/**
 * botyum-basics – Ana modül yöneticisi
 * Bu dosya:
 *  • Ortak yardımcıları hazırlar
 *  • features1…features6 modüllerini kaydeder
 *  • Alarmları planlar ve tetikler
 *  • Kullanıcıya modül menüsü sunar
 */

import inquirer from "inquirer";
import chalk from "chalk";
import { exec as _exec } from "child_process";
import { promisify } from "util";
import fs from "fs-extra";
import os from "os";
import path from "path";
import open from "open";

// Ek kütüphaneler features modüllerinin ihtiyaçlarına göre bağlanacak
import { htmlToText } from "html-to-text";
import { DateTime, Interval, Duration } from "luxon";
import ct from "countries-and-timezones";
import { getCode as getCountryCode } from "country-list";
import { create, all } from "mathjs";
import Table from "cli-table3";

// Feature modülleri
import { registerFeatures1 } from "./features1.js";
import { registerFeatures2 } from "./features2.js";
import { registerFeatures3 } from "./features3.js";
import { registerFeatures4 } from "./features4.js";
import { registerFeatures5 } from "./features5.js";
import { registerFeatures6 } from "./features6.js";

// Yardımcı fonksiyonlar & ayarlar
const exec = promisify(_exec);
const math = create(all, { number: "number" });

const title = chalk.bold.cyan;
const dim = chalk.dim;
const ok = chalk.green;
const warn = chalk.yellow;
const err = chalk.red;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isWindows() {
  return process.platform === "win32";
}
function isMac() {
  return process.platform === "darwin";
}
function printDivider() {
  console.log(dim("─".repeat(80)));
}

// Basit curl wrapper
async function curl(url, headers = {}, timeoutSec = 20, method = "GET", body = null) {
  const headerArgs = Object.entries({
    "User-Agent": "Mozilla/5.0",
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
    ...headers,
  })
    .map(([k, v]) => `-H "${k}: ${v}"`)
    .join(" ");
  const bodyArg = body ? `--data-raw '${body}'` : "";
  const cmd = `curl -m ${timeoutSec} -Ls ${headerArgs} --compressed -X ${method} ${bodyArg} "${url}"`;
  try {
    const { stdout } = await exec(cmd);
    return stdout;
  } catch (e) {
    throw new Error(`curl hatası: ${e.message}`);
  }
}

// Kalıcı depolama
const HOME = os.homedir();
const STORE_DIR = path.join(HOME, ".botyum");
const STORE_FILE = path.join(STORE_DIR, "botyum.json");
await fs.ensureDir(STORE_DIR);
if (!(await fs.pathExists(STORE_FILE))) {
  await fs.writeJson(
    STORE_FILE,
    {
      notes: [],
      todos: [],
      alarms: [],
      settings: {
        libretranslate_url: process.env.LIBRETRANSLATE_URL || "https://libretranslate.de",
        tts_enabled: true,
      },
    },
    { spaces: 2 }
  );
}
async function readStore() {
  return fs.readJson(STORE_FILE);
}
async function writeStore(data) {
  return fs.writeJson(STORE_FILE, data, { spaces: 2 });
}

// TTS konuşma (platforma bağlı)
async function ttsSay(text) {
  if (!text) return;
  try {
    if (isMac()) {
      await exec(`say ${JSON.stringify(text)}`);
    } else if (isWindows()) {
      const ps = `powershell -NoProfile -Command "Add-Type -AssemblyName System.Speech; ` +
        `$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; ` +
        `$s.Rate = 0; $s.Volume = 100; $s.Speak(${JSON.stringify(text)});"`;
      await exec(ps);
    } else {
      try {
        await exec(`espeak ${JSON.stringify(text)}`);
      } catch {
        await exec(`spd-say ${JSON.stringify(text)}`);
      }
    }
  } catch {
    // başarısızsa sessiz geç
  }
}

// context objesi modüllere verilecek
const ctxBase = {
  inquirer,
  ok,
  err,
  warn,
  dim,
  title,
  printDivider,
  sleep,
  curl,
  readStore,
  writeStore,
  ttsSay,
  isWindows,
  isMac,
  open,
  // features için gereken ek bağlam
  DateTime,
  Interval,
  Duration,
  ct,
  getCountryCode,
  math,
  htmlToText,
  Table,
};

// Feature modüllerini kaydet
const features1 = registerFeatures1(ctxBase);
const features2 = registerFeatures2({
  curl,
  ttsSay,
  ok,
  err,
  warn,
  dim,
  title,
  printDivider,
  readStore,
  writeStore,
  // schedule fonksiyonlarını index.js’e iletecek placeholder
  scheduleCountdown: async (ms, msg) => {
    const id = "t-" + Date.now();
    const when = DateTime.now().plus({ milliseconds: ms }).toISO();
    const s = await readStore();
    s.alarms ||= [];
    s.alarms.push({ id, type: "countdown", message: msg, when });
    await writeStore(s);
    planOneAlarm({ id, message: msg, when });
  },
  scheduleAbsolute: async (whenISO, msg) => {
    const id = "a-" + Date.now();
    const s = await readStore();
    s.alarms ||= [];
    s.alarms.push({ id, type: "alarm", message: msg, when: whenISO });
    await writeStore(s);
    planOneAlarm({ id, message: msg, when: whenISO });
  },
  STORE_FILE,
  inquirer,
  exec,
  isWindows,
  isMac,
});
const features3 = registerFeatures3({
  curl,
  ok,
  err,
  warn,
  dim,
  title,
  printDivider,
  inquirer,
  exec,
});
const features4 = registerFeatures4({
  inquirer,
  curl,
  ok,
  err,
  warn,
  dim,
  title,
  printDivider,
  readStore,
  writeStore,
  exec,
});
const features5 = registerFeatures5(ctxBase);
const features6 = registerFeatures6({
  inquirer,
  curl,
  ok,
  err,
  warn,
  dim,
  title,
  printDivider,
  readStore,
  writeStore,
  exec,
  open,
  ttsSay,
  isWindows,
  isMac,
});

// Alarm planlama altyapısı
const scheduled = new Map();
function planOneAlarm(a) {
  if (scheduled.has(a.id)) return;
  const ms = DateTime.fromISO(a.when).diffNow().toMillis();
  if (ms <= 0) return;
  const t = setTimeout(async () => {
    console.log("\n" + ok(`🔔 ALARM (#${a.id}): ${a.message}`));
    process.stdout.write("\x07");
    await ttsSay(a.message).catch(() => {});
    const st = await readStore();
    const idx = st.alarms.findIndex((x) => x.id === a.id);
    if (idx >= 0) {
      st.alarms.splice(idx, 1);
      await writeStore(st);
    }
    scheduled.delete(a.id);
  }, ms);
  scheduled.set(a.id, t);
}

async function scheduleScanAndPlan() {
  const s = await readStore();
  if (!s.alarms) return;
  for (const a of s.alarms) {
    planOneAlarm(a);
  }
}

// Başlangıçta alarm planla + periyodik kontrol
await scheduleScanAndPlan();
setInterval(() => {
  scheduleScanAndPlan().catch(() => {});
}, 20000);

// Ana menü
async function mainMenu() {
  console.log(title("\n🤖 botyum-basics – modüler sürüm\n"));
  while (true) {
    const { choice } = await inquirer.prompt([
      {
        type: "list",
        name: "choice",
        pageSize: 30,
        message: "Bir modül seç:",
        choices: [
          { name: "Çekirdek (features1)", value: "f1" },
          { name: "Modül 2 (Takvim / Haber / Media)", value: "f2" },
          { name: "Modül 3 (Sosyal / Bugünüm / Sözlük)", value: "f3" },
          { name: "Modül 4 (Webhook / QR / Dosya Ara vs.)", value: "f4" },
          { name: "Modül 5 (Oyun / Sözlük / Finans)", value: "f5" },
          { name: "Modül 6 (STT / OCR / Kamera / Slack)", value: "f6" },
          { name: "Çıkış", value: "exit" },
        ],
      },
    ]);

    if (choice === "exit") {
      console.log(dim("Çıkılıyor..."));
      process.exit(0);
    }

    if (choice === "f1") {
      await features1.timeAndDateMenu();
    } else if (choice === "f2") {
      // Alt-menü features2’yi çağır
      await features2.calendarMenu();
    } else if (choice === "f3") {
      await features3.todayOverviewMenu();
    } else if (choice === "f4") {
      await features4.smartHomeWebhookMenu();
    } else if (choice === "f5") {
      await features5.rollSingleDie();
    } else if (choice === "f6") {
      await features6.speechToClipboardMenu();
    }

    await scheduleScanAndPlan();
    await sleep(120);
  }
}

mainMenu();
