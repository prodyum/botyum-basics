// modules/finance/forex-converter.js
// Currency conversion with exchangerate.host caching.


import fs from "fs-extra";
import path from "path";

import { CACHE_DIR } from "../shared/web-search-utils.js";

export function createForexConverterGroup(ctx) {
  const { inquirer, ok, err, curl } = ctx;

  async function loadRates() {
    const cacheFile = path.join(CACHE_DIR, "fx-usd-base.json");
    if (await fs.pathExists(cacheFile)) {
      const stat = await fs.stat(cacheFile);
      if (Date.now() - stat.mtimeMs < 60 * 1000) {
        try {
          return await fs.readJson(cacheFile);
        } catch {}
      }
    }
    const response = await curl(
      "https://api.exchangerate.host/latest?base=USD",
      { Accept: "application/json" },
      20,
    );
    const data = JSON.parse(response);
    await fs.writeJson(cacheFile, data);
    return data;
  }

  async function convertCurrency() {
    const { question } = await inquirer.prompt([
      { type: "input", name: "question", message: "Soru (örn: 200 USD kaç TRY?)" },
    ]);
    if (!question) return;
    let ratesData;
    try {
      ratesData = await loadRates();
    } catch (error) {
      console.log(err(`Kur verisi alınamadı: ${error.message}`));
      return;
    }
    const match = question.match(/(\d+(?:\.\d+)?)\s*([A-Za-z]{3}).*?([A-Za-z]{3})/);
    if (!match) {
      console.log(err("Örnek: 200 USD kaç TRY?"));
      return;
    }
    const amount = parseFloat(match[1]);
    const from = match[2].toUpperCase();
    const to = match[3].toUpperCase();
    const rates = ratesData.rates || {};

    const toUSD = (value, code) => {
      if (code === "USD") return value;
      const rate = rates[code];
      if (!rate) return NaN;
      return value / rate;
    };
    const fromUSD = (value, code) => {
      if (code === "USD") return value;
      const rate = rates[code];
      if (!rate) return NaN;
      return value * rate;
    };
    const inUSD = toUSD(amount, from);
    if (!Number.isFinite(inUSD)) {
      console.log(err(`Desteklenmeyen para birimi: ${from}`));
      return;
    }
    const out = fromUSD(inUSD, to);
    if (!Number.isFinite(out)) {
      console.log(err(`Desteklenmeyen para birimi: ${to}`));
      return;
    }
    console.log(ok(`${amount} ${from} → ${out.toFixed(2)} ${to}`));
  }

  return {
    id: "forex-converter",
    label: "Döviz çevirici",
    description: "USD tabanlı döviz çevirileri yapar.",
    items: [{ id: "forex-converter-run", label: "Döviz çevir", run: convertCurrency }],
  };
}



