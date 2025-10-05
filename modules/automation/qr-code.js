// Description: Implements the qr code features.

export function createQrCodeGroup(ctx) {
  const { inquirer, ok, title, printDivider } = ctx;

  async function generateQr() {
    const answers = await inquirer.prompt([
      { type: "input", name: "data", message: "Metin / URL" },
      { type: "input", name: "size", message: "Boyut (px)", default: "300" },
    ]);
    const link = `https://api.qrserver.com/v1/create-qr-code/?size=${encodeURIComponent(answers.size)}x${encodeURIComponent(answers.size)}&data=${encodeURIComponent(answers.data)}`;
    console.log(title("QR Kodu URL"));
    console.log(ok(link));
    printDivider();
  }

  return {
    id: "qr-code",
    label: "QR kod oluşturucu",
    description: "Metinden hızlıca QR kod URL\'si üretir.",
    items: [{ id: "qr-code-run", label: "QR kod üret", run: generateQr }],
  };
}


