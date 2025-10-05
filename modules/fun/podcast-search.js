// modules/fun/podcast-search.js
// Search podcasts via the iTunes API.


export function createPodcastSearchGroup(ctx) {
  const { inquirer, ok, warn, err, printDivider, curl } = ctx;

  async function searchPodcasts() {
    const { term } = await inquirer.prompt([{ type: "input", name: "term", message: "Podcast araması" }]);
    if (!term) return;
    try {
      const url = `https://itunes.apple.com/search?media=podcast&term=${encodeURIComponent(term)}&limit=10`;
      const response = await curl(url, { Accept: "application/json" }, 20);
      const json = JSON.parse(response);
      const items = json.results || [];
      if (!items.length) {
        console.log(warn("Sonuç bulunamadı."));
        return;
      }
      printDivider();
      items.forEach((item, index) => {
        console.log(`${ok(String(index + 1).padStart(2, "0"))}) ${item.collectionName || item.trackName}`);
        console.log(`   ${item.feedUrl || item.collectionViewUrl}`);
      });
      printDivider();
    } catch (error) {
      console.log(err(`Podcast araması hatası: ${error.message}`));
    }
  }

  return {
    id: "podcast-search",
    label: "Podcast araması",
    description: "iTunes Search API üzerinden podcast arar.",
    items: [{ id: "podcast-search-run", label: "Podcast ara", run: searchPodcasts }],
  };
}



