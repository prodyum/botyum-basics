// Description: Implements the price watch features.

import fs from "fs-extra";
import path from "path";

import { BOTYUM_CACHE, ensureBotyumDir } from "./utils.js";

export function createPriceWatchGroup(ctx) {
  const { ok, err, curl } = ctx;

  async function showPrices() {
    await ensureBotyumDir();
    const cacheFile = path.join(BOTYUM_CACHE, "prices.json");
    let data = null;
    if (await fs.pathExists(cacheFile)) {
      const stat = await fs.stat(cacheFile);
      if (Date.now() - stat.mtimeMs < 30 * 60 * 1000) {
        try {
          data = await fs.readJson(cacheFile);
        } catch {
          data = null;
        }
      }
    }
    if (!data) {
      // 1) CoinGecko dene (opsiyonel API anahtarıyla)
      const cgHeaders = { Accept: "application/json" };
      const cgKey = process.env.COINGECKO_API_KEY || process.env.CG_DEMO_KEY;
      if (cgKey) {
        cgHeaders["x-cg-demo-api-key"] = cgKey; // demo anahtarı uyumlu
        cgHeaders["x-cg-pro-api-key"] = cgKey; // pro anahtarı uyumlu
      }
      const cgUrl = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd";
      let fetched = null;
      try {
        const response = await curl(cgUrl, cgHeaders, 15);
        fetched = JSON.parse(response);
      } catch {
        fetched = null;
      }
      // 2) Coinbase yedek
      if (!fetched) {
        try {
          const btcJson = JSON.parse(await curl("https://api.coinbase.com/v2/prices/BTC-USD/spot", { Accept: "application/json" }, 15));
          const ethJson = JSON.parse(await curl("https://api.coinbase.com/v2/prices/ETH-USD/spot", { Accept: "application/json" }, 15));
          const btc = Number(btcJson?.data?.amount);
          const eth = Number(ethJson?.data?.amount);
          if (Number.isFinite(btc) && Number.isFinite(eth)) {
            fetched = { bitcoin: { usd: btc }, ethereum: { usd: eth } };
          }
        } catch {
          fetched = null;
        }
      }
      if (!fetched) {
        console.log(err("Fiyat verisi alınamadı: ağ engeli veya sağlayıcı kısıtlaması."));
        return;
      }
      data = fetched;
      await ensureBotyumDir();
      await fs.writeJson(cacheFile, data);
    }
    console.log(ok(`BTC/USD → ${data.bitcoin?.usd}`));
    console.log(ok(`ETH/USD → ${data.ethereum?.usd}`));
  }

  return {
    id: "price-watch",
    label: "Fiyat takip",
    description: "BTC ve ETH fiyatlarını hızlıca gösterir.",
    items: [{ id: "price-watch-run", label: "Fiyatları göster", run: showPrices }],
  };
}


