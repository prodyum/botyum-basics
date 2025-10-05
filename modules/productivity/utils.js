// Description: Implements the utils features.
import fs from "fs-extra";
import path from "path";
import os from "os";

export const BOTYUM_HOME = path.join(os.homedir(), ".botyum");
export const BOTYUM_CACHE = path.join(BOTYUM_HOME, "cache");
fs.ensureDirSync(BOTYUM_HOME);
fs.ensureDirSync(BOTYUM_CACHE);

export function ensureBotyumDir(...segments) {
  const dir = path.join(BOTYUM_HOME, ...segments);
  fs.ensureDirSync(dir);
  return dir;
}

export function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}


