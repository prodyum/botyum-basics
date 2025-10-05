// Description: Implements the package tracking features.

export function createPackageTrackingGroup(ctx) {
  const { inquirer, ok } = ctx;

  async function trackPackage() {
    const { code } = await inquirer.prompt([{ type: "input", name: "code", message: "Takip numarası" }]);
    if (!code) {
      return;
    }
    const url = `https://www.google.com/search?q=${encodeURIComponent(`kargo takip ${code}`)}`;
    console.log(ok(url));
  }

  return {
    id: "package-tracking",
    label: "Kargo takibi",
    description: "Takip numarası için hızlı arama bağlantısı üretir.",
    items: [{ id: "package-tracking-run", label: "Takip linki oluştur", run: trackPackage }],
  };
}


