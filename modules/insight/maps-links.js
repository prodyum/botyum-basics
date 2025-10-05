// Description: Implements the maps links features.

export function createMapsLinksGroup(ctx) {
  const { inquirer, ok, dim, open } = ctx;

  async function openMap() {
    const answers = await inquirer.prompt([
      { type: "list", name: "service", message: "Harita servisi", choices: ["Google Maps", "Yandex Maps", "Apple Maps"] },
      { type: "input", name: "query", message: "Yer (ilçe/mahalle/semt):" },
      { type: "confirm", name: "launch", message: "Tarayıcıda aç?", default: false },
    ]);
    const encoded = encodeURIComponent(answers.query || "");
    let url = "";
    if (answers.service === "Google Maps") url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    else if (answers.service === "Yandex Maps") url = `https://yandex.com.tr/maps/?text=${encoded}`;
    else url = `https://maps.apple.com/?q=${encoded}`;
    console.log(ok(url));
    if (answers.launch) {
      await open(url);
      console.log(dim("Açıldı."));
    }
  }

  return {
    id: "maps-links",
    label: "Harita bağlantıları",
    description: "Google/Yandex/Apple Maps için hızlı link üretir.",
    items: [{ id: "maps-links-open", label: "Harita bağlantısı oluştur", run: openMap }],
  };
}


