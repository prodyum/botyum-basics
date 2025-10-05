// Description: Provides reusable helpers for DuckDuckGo scraping and cache directories.

import fs from "fs-extra";
import path from "path";

export const CACHE_DIR = path.join(process.cwd(), "cache");
fs.ensureDirSync(CACHE_DIR);

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseDuckDuckGo(html, siteFilter = null, limit = 15) {
  const results = [];
  const rx = /<a[^>]*class="[^\"]*result__a[^\"]*"[^>]*href="([^\"]+)"[^>]*>(.*?)<\/a>/gsi;
  let match;
  let index = 1;
  while ((match = rx.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].replace(/<[^>]+>/g, "").trim();
    if (!title || !url) continue;
    if (siteFilter && !url.includes(siteFilter)) continue;
    results.push({ i: index, title, url });
    index += 1;
    if (results.length >= limit) break;
  }
  return results;
}

