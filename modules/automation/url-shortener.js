// Description: Implements the url shortener features.

export function createUrlShortenerGroup(ctx) {
  const { inquirer, ok, err, printDivider, curl } = ctx;

  async function shortenUrl() {
    const { url } = await inquirer.prompt([{ type: "input", name: "url", message: "Kısaltılacak URL" }]);
    if (!url) return;
    try {
      const short = await curl(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
        { Accept: "text/plain" },
        15,
      );
      console.log(ok(short.trim()));
    } catch (error) {
      console.log(err(`Kısaltma başarısız: ${error.message}`));
    }
    printDivider();
  }

  return {
    id: "url-shortener",
    label: "URL kısaltıcı",
    description: "TinyURL API ile kısaltma linki üretir.",
    items: [{ id: "url-shortener-run", label: "URL kısalt", run: shortenUrl }],
  };
}


