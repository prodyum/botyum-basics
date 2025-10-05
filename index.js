#!/usr/bin/env node
/**
 * botyum-basics - Ana modul yoneticisi
 * Bu dosya:
 *  - Ortak yardimcilari hazirlar
 *  - Eklentileri tarar ve kaydeder
 *  - Alarmlari planlar ve tetikler
 *  - Kullaniciya modul menusu sunar
 */

import inquirer from "inquirer";
import chalk from "chalk";
import { exec as _exec } from "child_process";
import { promisify } from "util";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import open from "open";

// Ek kutuphaneler features modullerinin ihtiyaclarina gore baglanacak
import { htmlToText } from "html-to-text";
import { DateTime, Interval, Duration } from "luxon";
import ct from "countries-and-timezones";
import { getCode as getCountryCode } from "country-list";
import { create, all } from "mathjs";
import Table from "cli-table3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODULES_DIR = path.join(__dirname, "modules");

// Yardimci fonksiyonlar ve ayarlar
const exec = promisify(_exec);
const math = create(all, { number: "number" });
const inquirerPromptOriginal = inquirer.prompt.bind(inquirer);

const title = chalk.bold.cyan;
const dim = chalk.dim;
const ok = chalk.green;
const warn = chalk.yellow;
const err = chalk.red;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isWindows() {
  return process.platform === "win32";
}

function isMac() {
  return process.platform === "darwin";
}

function printDivider() {
  console.log(dim("-".repeat(80)));
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
  } catch (error) {
    throw new Error(`curl hatasi: ${error.message}`);
  }
}

// Kalici depolama
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

// TTS konusma (platforma bagli)
async function ttsSay(text) {
  if (!text) return;
  try {
    if (isMac()) {
      await exec(`say ${JSON.stringify(text)}`);
    } else if (isWindows()) {
      const ps =
        "powershell -NoProfile -Command \"Add-Type -AssemblyName System.Speech; " +
        "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; " +
        "$s.Rate = 0; $s.Volume = 100; $s.Speak(" + JSON.stringify(text) + ");\"";
      await exec(ps);
    } else {
      try {
        await exec(`espeak ${JSON.stringify(text)}`);
      } catch {
        await exec(`spd-say ${JSON.stringify(text)}`);
      }
    }
  } catch {
    // Basarisizsa sessiz gec
  }
}

const scheduled = new Map();

function planOneAlarm(alarm) {
  if (scheduled.has(alarm.id)) {
    return;
  }
  const ms = DateTime.fromISO(alarm.when).diffNow().toMillis();
  if (ms <= 0) {
    return;
  }
  const timer = setTimeout(async () => {
    console.log("\n" + ok(`ALARM (#${alarm.id}): ${alarm.message}`));
    process.stdout.write("\x07");
    await ttsSay(alarm.message).catch(() => {});
    const store = await readStore();
    const index = store.alarms.findIndex((entry) => entry.id === alarm.id);
    if (index >= 0) {
      store.alarms.splice(index, 1);
      await writeStore(store);
    }
    scheduled.delete(alarm.id);
  }, ms);
  scheduled.set(alarm.id, timer);
}

async function scheduleScanAndPlan() {
  const store = await readStore();
  if (!store.alarms) {
    return;
  }
  for (const alarm of store.alarms) {
    planOneAlarm(alarm);
  }
}

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
  DateTime,
  Interval,
  Duration,
  ct,
  getCountryCode,
  math,
  htmlToText,
  Table,
  STORE_FILE,
  exec,
  fs,
  path,
  modulesDir: MODULES_DIR,
  scheduleCountdown: async (milliseconds, message) => {
    const id = "t-" + Date.now();
    const when = DateTime.now().plus({ milliseconds }).toISO();
    const store = await readStore();
    store.alarms ||= [];
    store.alarms.push({ id, type: "countdown", message, when });
    await writeStore(store);
    planOneAlarm({ id, message, when });
  },
  scheduleAbsolute: async (whenISO, message) => {
    const id = "a-" + Date.now();
    const store = await readStore();
    store.alarms ||= [];
    store.alarms.push({ id, type: "alarm", message, when: whenISO });
    await writeStore(store);
    planOneAlarm({ id, message, when: whenISO });
  },
};

const alwaysUpperCaseWords = new Set(["csv", "pdf", "ocr", "tts", "url", "stt", "qr", "ics", "api", "crud", "sms"]);

function formatFeatureName(key) {
  if (!key) {
    return "Ozellik";
  }
  const cleaned = key.replace(/Menu$/i, "");
  const withSpaces = cleaned
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ");
  const words = withSpaces.split(/\s+/).filter(Boolean);
  if (!words.length) {
    return cleaned;
  }
  return words
    .map((word) => {
      const lower = word.toLowerCase();
      if (alwaysUpperCaseWords.has(lower)) {
        return lower.toUpperCase();
      }
      if (lower.length <= 2) {
        return lower.toUpperCase();
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1).toLowerCase();
    })
    .join(" ");
}

function createModule(id, label, definition) {
  const groupsInput = definition?.featureGroups ?? [];
  const groups = groupsInput.map((group, groupIndex) => {
    const groupId = group.id || `${id}-group-${groupIndex + 1}`;
    const groupLabel = group.label || formatFeatureName(groupId);
    const itemsInput = group.items ?? [];
    const items = itemsInput.map((item, itemIndex) => {
      const itemId = item.id || `${groupId}-item-${itemIndex + 1}`;
      const itemLabel = item.label || formatFeatureName(itemId);
      return {
        id: itemId,
        label: itemLabel,
        run: item.run,
        order: itemIndex,
      };
    });
    return {
      id: groupId,
      label: groupLabel,
      description: group.description || "",
      order: groupIndex,
      items,
      itemMap: new Map(items.map((item) => [item.id, item])),
    };
  });
  return {
    id,
    label,
    description: definition?.description || "",
    groups,
    groupMap: new Map(groups.map((group) => [group.id, group])),
  };
}

const pluginEntryCandidates = ["index.js", "module.js", "plugin.js"];

async function findPluginEntry(moduleDir) {
  for (const candidate of pluginEntryCandidates) {
    const candidatePath = path.join(moduleDir, candidate);
    if (await fs.pathExists(candidatePath)) {
      return candidatePath;
    }
  }
  return null;
}

async function loadModulePlugins(ctx) {
  let entries = [];
  try {
    entries = await fs.readdir(MODULES_DIR, { withFileTypes: true });
  } catch (error) {
    console.log(err(`Modules klasoru okunamadi: ${error.message}`));
    if (process.env.DEBUG) {
      console.log(dim(error.stack || ""));
    }
    return [];
  }

  const loaded = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    if (entry.name.startsWith("_")) {
      continue;
    }
    const moduleDir = path.join(MODULES_DIR, entry.name);
    const entryFile = await findPluginEntry(moduleDir);
    if (!entryFile) {
      continue;
    }
    try {
      const imported = await import(pathToFileURL(entryFile).href);
      const candidate = imported?.default ?? imported?.plugin ?? imported;
      if (!candidate || typeof candidate.id !== "string" || typeof candidate.register !== "function") {
        if (process.env.DEBUG) {
          console.log(dim(`'${entry.name}' eklentisi gecerli degil, atlandi.`));
        }
        continue;
      }
      const label = candidate.label || formatFeatureName(candidate.id);
      const description = candidate.description || "";
      const order = typeof candidate.order === "number" ? candidate.order : Number.MAX_SAFE_INTEGER;
      const moduleContext = {
        ...ctx,
        moduleId: candidate.id,
        moduleLabel: label,
        moduleDir,
        resolve: (...segments) => path.join(moduleDir, ...segments),
      };
      let definition;
      try {
        definition = await candidate.register(moduleContext);
      } catch (registerError) {
        console.log(err(`'${label}' modulu yuklenemedi: ${registerError.message}`));
        if (process.env.DEBUG) {
          console.log(dim(registerError.stack || ""));
        }
        continue;
      }
      if (!definition) {
        continue;
      }
      const featureGroups = definition.featureGroups ?? definition.groups ?? [];
      const moduleDefinition = {
        featureGroups,
        description: definition.description ?? description,
      };
      const moduleInstance = createModule(candidate.id, label, moduleDefinition);
      moduleInstance.description = moduleDefinition.description ?? description ?? "";
      moduleInstance.order = candidate.order ?? moduleDefinition.order ?? order;
      loaded.push(moduleInstance);
    } catch (importError) {
      console.log(err(`'${entry.name}' eklentisi yuklenirken hata olustu: ${importError.message}`));
      if (process.env.DEBUG) {
        console.log(dim(importError.stack || ""));
      }
    }
  }

  loaded.sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.label.localeCompare(b.label, "tr");
  });
  return loaded;
}

let modules = [];
let moduleMap = new Map();

async function refreshModules(reason = "initial") {
  const discovered = await loadModulePlugins(ctxBase);
  modules = discovered;
  moduleMap = new Map(discovered.map((module) => [module.id, module]));
  if (!modules.length) {
    if (reason === "initial") {
      console.log(warn("Aktif modul bulunamadi. Modules klasorune uyumlu bir eklenti ekleyin."));
    }
  } else if (process.env.DEBUG) {
    console.log(dim(`(${reason}) ${modules.length} modul yuklendi.`));
  }
}

await refreshModules();

await scheduleScanAndPlan();
setInterval(() => {
  scheduleScanAndPlan().catch(() => {});
}, 20000);

function withDescription(label, description) {
  if (!description) {
    return label;
  }
  return `${label} ${dim("- " + description)}`;
}

function normalizeMenuChoices(rawChoices) {
  if (!Array.isArray(rawChoices)) {
    return [];
  }
  return rawChoices.map((choice, index) => {
    if (choice == null) {
      return {
        name: `Secim ${index + 1}`,
        value: null,
        disabled: true,
        raw: choice,
      };
    }
    if (typeof choice === "string" || typeof choice === "number" || typeof choice === "boolean") {
      return {
        name: String(choice),
        value: choice,
        disabled: false,
        raw: choice,
      };
    }
    if (typeof choice === "object") {
      if (choice.type === "separator") {
        return {
          name: String(choice.line ?? "----------"),
          value: null,
          disabled: true,
          raw: choice,
        };
      }
      const name = choice.name ?? choice.title ?? choice.value ?? `Secim ${index + 1}`;
      const value = choice.value ?? choice.name ?? index + 1;
      return {
        name: String(name),
        value,
        disabled: Boolean(choice.disabled),
        raw: choice,
      };
    }
    return {
      name: String(choice),
      value: choice,
      disabled: false,
      raw: choice,
    };
  });
}

async function promptMenuSelection(message, rawChoices, options = {}) {
  const normalized = normalizeMenuChoices(rawChoices);
  const selectable = normalized.filter((choice) => !choice.disabled);
  if (selectable.length === 0) {
    throw new Error("Secim yapilabilecek bir secenek bulunamadi.");
  }
  const displayOptions = selectable.map((choice, index) => ({
    ...choice,
    index: index + 1,
  }));
  const valueKeyMap = new Map();
  const labelKeyMap = new Map();
  const directValueMap = new Map();
  for (const option of displayOptions) {
    if (option.value !== null && option.value !== undefined) {
      const valueKey = String(option.value).toLowerCase();
      if (!valueKeyMap.has(valueKey)) {
        valueKeyMap.set(valueKey, option);
      }
    }
    const labelKey = option.name.toLowerCase();
    if (!labelKeyMap.has(labelKey)) {
      labelKeyMap.set(labelKey, option);
    }
    if (!directValueMap.has(option.value)) {
      directValueMap.set(option.value, option);
    }
  }
  const resolveDefaultOption = (defaultInput) => {
    if (defaultInput === undefined || defaultInput === null) {
      return undefined;
    }
    if (typeof defaultInput === "number" && Number.isFinite(defaultInput)) {
      if (displayOptions[defaultInput]) {
        return displayOptions[defaultInput];
      }
      if (displayOptions[defaultInput - 1]) {
        return displayOptions[defaultInput - 1];
      }
    }
    if (directValueMap.has(defaultInput)) {
      return directValueMap.get(defaultInput);
    }
    if (typeof defaultInput === "string") {
      const lower = defaultInput.toLowerCase();
      if (valueKeyMap.has(lower)) {
        return valueKeyMap.get(lower);
      }
      if (labelKeyMap.has(lower)) {
        return labelKeyMap.get(lower);
      }
    }
    return undefined;
  };
  const defaultOption = resolveDefaultOption(options.defaultValue);
  while (true) {
    console.log("");
    console.log(message);
    const hints = ["Secim yapmak icin numarayi yazip Enter'a basin."];
    if (defaultOption) {
      hints.push(`Varsayilan: ${defaultOption.index}. ${defaultOption.name}`);
    }
    console.log(dim(hints.join(" ")));
    for (const option of displayOptions) {
      const marker = defaultOption && option.value === defaultOption.value ? dim(" (varsayilan)") : "";
      console.log(`${option.index}. ${option.name}${marker}`);
    }
    const { selection } = await inquirerPromptOriginal([
      {
        type: "input",
        name: "selection",
        message: "Numara veya deger:",
        filter: (input) => (input ?? "").toString().trim(),
      },
    ]);
    if (!selection) {
      if (defaultOption) {
        return defaultOption.value;
      }
      console.log(warn("Lutfen bir secim gir."));
      continue;
    }
    const normalizedInput = selection.toString().trim();
    const numeric = Number(normalizedInput);
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= displayOptions.length) {
      return displayOptions[numeric - 1].value;
    }
    const maybeByValue = valueKeyMap.get(normalizedInput.toLowerCase());
    if (maybeByValue) {
      return maybeByValue.value;
    }
    const maybeByLabel = displayOptions.find((option) => option.name.toLowerCase().startsWith(normalizedInput.toLowerCase()));
    if (maybeByLabel) {
      return maybeByLabel.value;
    }
    console.log(err("Gecersiz secim, lutfen listedeki numaralardan birini kullan."));
  }
}

async function accessiblePrompt(questions) {
  const questionArray = Array.isArray(questions) ? questions.slice() : [questions];
  const answers = {};
  for (const entry of questionArray) {
    let question = entry;
    if (typeof question === "function") {
      question = await question(answers);
    }
    if (!question) {
      continue;
    }
    if (typeof question.when === "function") {
      const shouldAsk = await question.when(answers);
      if (!shouldAsk) {
        continue;
      }
    } else if (question.when === false) {
      continue;
    }
    if (question.type === "list") {
      let choices = question.choices;
      if (typeof choices === "function") {
        choices = await choices(answers);
      }
      if (!Array.isArray(choices)) {
        choices = choices == null ? [] : [choices];
      }
      let defaultValue = question.default;
      if (typeof defaultValue === "function") {
        defaultValue = await defaultValue(answers);
      }
      const promptOptions = {
        defaultValue,
      };
      const segments = [question.prefix, question.message || question.name || "Secim", question.suffix];
      const messageText =
        segments
          .filter((segment) => typeof segment === "string" && segment.trim().length)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim() || "Secim";
      let answerValue;
      while (true) {
        answerValue = await promptMenuSelection(messageText, choices, promptOptions);
        if (typeof question.filter === "function") {
          answerValue = await question.filter(answerValue, answers);
        }
        if (typeof question.validate === "function") {
          const validation = await question.validate(answerValue, answers);
          if (validation !== true) {
            const feedback = typeof validation === "string" ? validation : "Secim gecersiz, lutfen yeniden deneyin.";
            console.log(err(feedback));
            continue;
          }
        }
        break;
      }
      if (typeof question.name === "string") {
        answers[question.name] = answerValue;
      }
    } else {
      const response = await inquirerPromptOriginal([question]);
      Object.assign(answers, response);
    }
  }
  return Array.isArray(questions) ? answers : answers;
}

inquirer.prompt = accessiblePrompt;

async function runFeature(fn) {
  if (typeof fn !== "function") {
    return;
  }
  const result = fn();
  if (result && typeof result.then === "function") {
    await result;
  }
}

async function handleGroup(module, group) {
  if (!group || !group.items.length) {
    console.log(warn("Bu kategoride calistirilacak secim yok."));
    return;
  }
  while (true) {
    const choices = group.items.map((item) => ({
      name: item.label,
      value: item.id,
    }));
    choices.push({ name: "Geri don", value: "__back" });
    const featureId = await promptMenuSelection(`${group.label} icinde hangi araci calistirmak istersin?`, choices);
    if (featureId === "__back") {
      return;
    }
    const feature = group.itemMap.get(featureId);
    if (!feature || typeof feature.run !== "function") {
      console.log(err("Bu secim su anda kullanilamiyor."));
      continue;
    }
    console.log(dim(`\n${module.label} > ${group.label} > ${feature.label}`));
    try {
      await runFeature(feature.run);
    } catch (error) {
      console.log(err(`Islem tamamlanamadi: ${error.message}`));
      if (process.env.DEBUG) {
        console.log(dim(error.stack || ""));
      }
    }
    try {
      await scheduleScanAndPlan();
    } catch (error) {
      console.log(err(`Alarm planlama guncellenemedi: ${error.message}`));
    }
    if (typeof printDivider === "function") {
      printDivider();
    }
    await sleep(120);
  }
}

async function handleModule(module) {
  if (!module || !module.groups.length) {
    console.log(warn("Bu modulde henuz aktif ozellik yok."));
    return;
  }
  if (module.groups.length === 1) {
    await handleGroup(module, module.groups[0]);
    return;
  }
  while (true) {
    const groupChoices = module.groups.map((group) => ({
      name: withDescription(group.label, group.description),
      value: group.id,
    }));
    groupChoices.push({ name: "Ana menuye don", value: "__back" });
    const groupId = await promptMenuSelection(`${module.label} icinde hangi kategoriye bakmak istersin?`, groupChoices);
    if (groupId === "__back") {
      return;
    }
    const selectedGroup = module.groupMap.get(groupId);
    if (!selectedGroup) {
      console.log(err("Gecersiz kategori secildi, lutfen yeniden dene."));
      continue;
    }
    await handleGroup(module, selectedGroup);
  }
}

async function mainMenu() {
  console.log(title("\n== botyum-basics - moduler surum ==\n"));
  while (true) {
    await refreshModules("menu-loop");
    if (!modules.length) {
      console.log(warn("Yuklu modul yok. Modules klasorune eklenti ekleyin."));
      await sleep(1500);
      continue;
    }
    const choices = modules.map((module) => ({
      name: withDescription(module.label, module.description),
      value: module.id,
    }));
    choices.push({ name: "Uygulamadan cik", value: "exit" });
    const moduleId = await promptMenuSelection("Ihtiyacin olan modulu sec:", choices);
    if (moduleId === "exit") {
      console.log(dim("Gorusmek uzere!"));
      process.exit(0);
    }
    const module = moduleMap.get(moduleId);
    if (!module) {
      console.log(err("Bu modul bulunamadi, lutfen yeniden sec."));
      continue;
    }
    await handleModule(module);
  }
}

mainMenu();
