// Description: Implements the utils features.
import fs from "fs-extra";
import os from "os";
import path from "path";
import crypto from "crypto";

export const BOTYUM_HOME = path.join(os.homedir(), ".botyum");
export const BOTYUM_TMP = path.join(BOTYUM_HOME, "tmp");
fs.ensureDirSync(BOTYUM_HOME);
fs.ensureDirSync(BOTYUM_TMP);

export function ensureDir(...segments) {
  const dir = path.join(BOTYUM_HOME, ...segments);
  fs.ensureDirSync(dir);
  return dir;
}

export function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomPassword(length = 16, includeSymbols = true) {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const symbols = "!@#$%^&*()-_=+[]{};:,.<>?";
  const chars = includeSymbols ? letters + symbols : letters;
  const bytes = crypto.randomBytes(length);
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += chars[bytes[i] % chars.length];
  }
  return output;
}

export function randomWords(count = 6) {
  const list = [
    "kedi","martı","deniz","ışık","zaman","yol","bulut","çınar","atlas","ses",
    "kum","göl","bahar","maestro","güneş","gece","ufuk","gezgin","pamuk","nota",
    "yaz","kış","bahçe","rüzgar","fener","nehir","ada","kozmos","peri","keşif",
  ];
  const out = [];
  for (let i = 0; i < count; i += 1) {
    out.push(list[crypto.randomInt(0, list.length)]);
  }
  return out;
}


