// Description: Implements the utils features.
import fs from "fs-extra";
import os from "os";
import path from "path";

export const BOTYUM_HOME = path.join(os.homedir(), ".botyum");
fs.ensureDirSync(BOTYUM_HOME);

export function ensureDocuments() {
  const docs = path.join(process.cwd(), "documents");
  fs.ensureDirSync(docs);
  return docs;
}

export function safeParseJSON(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function parseDuckDuckGo(html, filter = null, limit = 10) {
  const results = [];
  const rx = /<a[^>]*class="[^\"]*result__a[^\"]*"[^>]*href="([^\"]+)"[^>]*>(.*?)<\/a>/gsi;
  let match;
  let index = 1;
  while ((match = rx.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].replace(/<[^>]+>/g, "").trim();
    if (!title || !url) continue;
    if (filter && !url.includes(filter)) continue;
    results.push({ i: index, title, url });
    index += 1;
    if (results.length >= limit) break;
  }
  return results;
}


