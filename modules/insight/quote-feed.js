// Description: Implements the quote feed features.

export function createQuoteFeedGroup(ctx) {
  const { ok, err, curl } = ctx;

  async function fetchQuote() {
    // 1) Quotable
    try {
      const response = await curl("https://api.quotable.io/random", { Accept: "application/json" }, 10);
      const json = JSON.parse(response);
      if (json?.content) {
        console.log(ok(`"${json.content}" - ${json.author || "Bilinmiyor"}`));
        return;
      }
    } catch {}
    // 2) ZenQuotes (JSON)
    try {
      const response2 = await curl("https://zenquotes.io/api/random", { Accept: "application/json" }, 10);
      const arr = JSON.parse(response2);
      const q = Array.isArray(arr) ? arr[0] : null;
      if (q?.q) {
        console.log(ok(`"${q.q}" - ${q.a || "Bilinmiyor"}`));
        return;
      }
    } catch {}
    console.log(err("Alıntı alınamadı: Ağ kısıtı olabilir."));
  }

  return {
    id: "quote-feed",
    label: "Günün alıntısı",
    description: "Quotable API'den rastgele söz getirir.",
    items: [{ id: "quote-feed-run", label: "Alıntı getir", run: fetchQuote }],
  };
}


