// Description: Implements the clipboard features.

export function createClipboardGroup(ctx) {
  const { inquirer, ok, dim } = ctx;

  async function handleClipboard() {
    const { action } = await inquirer.prompt([
      { type: "list", name: "action", message: "Pano işlemi", choices: ["Yazdır", "Temizle", "Geri"] },
    ]);
    if (action === "Geri") return;
    if (action === "Yazdır") {
      const data = process.env.CLIPBOARD || "";
      console.log(ok("Pano içeriği:"));
      console.log(data || dim("Boş"));
      return;
    }
    process.env.CLIPBOARD = "";
    console.log(ok("Pano temizlendi."));
  }

  return {
    id: "clipboard-tools",
    label: "Pano araçları",
    description: "Terminal dostu pano kontrolü (deneyseldir).",
    items: [{ id: "clipboard-handle", label: "Pano işle", run: handleClipboard }],
  };
}


