// modules/core/phone-links.js
// Produces tel: and sms: deep links and prints them to console.


export function createPhoneLinksGroup(ctx) {
  const { inquirer, ok, err, dim } = ctx;

  function normalizePhone(input) {
    const raw = String(input || "").trim();
    if (!raw) return "";
    // Keep leading +, remove non-digits otherwise
    const cleaned = raw
      .replace(/^[0\s]+/, "")
      .replace(/\(.*?\)/g, "")
      .replace(/[^+\d]/g, "");
    // Ensure only one leading +
    return cleaned.replace(/^\++/, "+");
  }

  function buildTelLink(phone) {
    return `tel:${phone}`;
  }

  function buildSmsLink(phone, body) {
    if (body && body.trim()) {
      const q = new URLSearchParams({ body: body });
      return `sms:${phone}?${q.toString()}`;
    }
    return `sms:${phone}`;
  }

  function buildWhatsAppLink(phone, body) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    if (body && body.trim()) {
      const q = new URLSearchParams({ text: body });
      return `https://wa.me/${digits}?${q.toString()}`;
    }
    return `https://wa.me/${digits}`;
  }

  async function runPhoneLinks() {
    const { phone } = await inquirer.prompt([
      { type: "input", name: "phone", message: "Telefon numarası (+90... veya yerel):" },
    ]);
    const normalized = normalizePhone(phone);
    if (!normalized) {
      console.log(err("Geçerli bir telefon numarası girin."));
      return;
    }
    const { msg } = await inquirer.prompt([
      { type: "input", name: "msg", message: "SMS mesajı (opsiyonel):", default: "" },
    ]);
    const telLink = buildTelLink(normalized);
    const smsLink = buildSmsLink(normalized, msg || "");
    const waLink = buildWhatsAppLink(normalized, msg || "");
    console.log(ok(telLink));
    console.log(dim(smsLink));
    if (waLink) {
      console.log(dim(waLink));
    }
  }

  return {
    id: "phone-links",
    label: "Çağrı/SMS/WhatsApp bağlantıları",
    description: "tel:, sms: ve WhatsApp deep-link bağlantıları üretir.",
    items: [
      { id: "phone-links-run", label: "Bağlantı üret", run: runPhoneLinks },
    ],
  };
}





