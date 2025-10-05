// Description: Implements the quote feed features.

export function createQuoteFeedGroup(ctx) {
  const { ok, err, curl } = ctx;

  async function fetchQuote() {
    try {
      const response = await curl("https://api.quotable.io/random", { Accept: "application/json" }, 10);
      const json = JSON.parse(response);
      console.log(ok(`"${json.content}" - ${json.author}`));
    } catch (error) {
      console.log(err(`Alıntı alınamadı: ${error.message}`));
    }
  }

  return {
    id: "quote-feed",
    label: "Günün alıntısı",
    description: "Quotable API'den rastgele söz getirir.",
    items: [{ id: "quote-feed-run", label: "Alıntı getir", run: fetchQuote }],
  };
}


