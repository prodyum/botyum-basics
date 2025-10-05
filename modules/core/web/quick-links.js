// Description: Implements the quick links features.

import { encodeQuery } from "../utils.js";

function buildTelLink(num) {
  return `tel:${String(num).replace(/\s+/g, "")}`;
}

function buildSmsLink(num, body) {
  return `sms:${String(num).replace(/\s+/g, "")}?&body=${encodeQuery(body || "")}`;
}

function buildWhatsAppLink(num, text) {
  return `https://wa.me/${String(num).replace(/\D+/g, "")}?text=${encodeQuery(text || "")}`;
}

export function createQuickLinksGroup(ctx) {
  const { inquirer, ok, dim, open } = ctx;

  async function generateLink() {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Hızlı bağlantı",
        choices: [
          { name: "Telefon araması", value: "call" },
          { name: "SMS", value: "sms" },
          { name: "WhatsApp", value: "wa" },
          { name: "Geri", value: "back" },
        ],
      },
    ]);
    if (action === "back") return;
    let link = "";
    if (action === "call") {
      const { num } = await inquirer.prompt([{ type: "input", name: "num", message: "Telefon" }]);
      link = buildTelLink(num);
    } else if (action === "sms") {
      const answers = await inquirer.prompt([
        { type: "input", name: "num", message: "Telefon" },
        { type: "input", name: "msg", message: "Mesaj" },
      ]);
      link = buildSmsLink(answers.num, answers.msg);
    } else if (action === "wa") {
      const answers = await inquirer.prompt([
        { type: "input", name: "num", message: "Telefon" },
        { type: "input", name: "msg", message: "Mesaj" },
      ]);
      link = buildWhatsAppLink(answers.num, answers.msg);
    }
    console.log(ok(link));
    const { openIt } = await inquirer.prompt([
      { type: "confirm", name: "openIt", message: "Tarayıcıda aç?", default: false },
    ]);
    if (openIt) {
      await open(link);
      console.log(dim("Açıldı."));
    }
  }

  return {
    id: "web-quick-links",
    label: "Hızlı bağlantılar",
    description: "Tel/SMS/WhatsApp linkleri üretir.",
    items: [{ id: "web-quick-links-run", label: "Bağlantı oluştur", run: generateLink }],
  };
}


