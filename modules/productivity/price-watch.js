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
      try {
        const response = await curl(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
          { Accept: "application/json" },
          15,
        );
        data = JSON.parse(response);
        await ensureBotyumDir();
        await fs.writeJson(cacheFile, data);
      } catch (error) {
        console.log(err(`Fiyat verisi alınamadı: ${error.message}`));
        return;
      }
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


