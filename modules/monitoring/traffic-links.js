// modules/monitoring/traffic-links.js
// Opens saved traffic and transit dashboards.


export function createTrafficLinksGroup(ctx) {
  const { inquirer, ok } = ctx;

  async function buildLink() {
    const answers = await inquirer.prompt([
      { type: "list", name: "service", message: "Servis", choices: ["Google Maps", "Yandex Maps", "Apple Maps"] },
      { type: "input", name: "location", message: "İl/ilçe/mahalle" },
    ]);
    const query = encodeURIComponent(answers.location || "");
    let url = "";
    if (answers.service === "Google Maps") url = `https://www.google.com/maps/search/?api=1&query=${query}&layer=t`;
    if (answers.service === "Yandex Maps") url = `https://yandex.com.tr/harita/?text=${query}&l=trf%2Ctrfe`;
    if (answers.service === "Apple Maps") url = `https://maps.apple.com/?q=${query}`;
    console.log(ok(url));
  }

  return {
    id: "traffic-links",
    label: "Trafik bağlantıları",
    description: "Harita servisine trafik katmanıyla yönlendirir.",
    items: [{ id: "traffic-links-run", label: "Link oluştur", run: buildLink }],
  };
}




