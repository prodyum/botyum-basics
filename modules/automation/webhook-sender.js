// Description: Implements the webhook sender features.

export function createWebhookSenderGroup(ctx) {
  const { inquirer, curl, ok, err, dim, title, printDivider, readStore, writeStore } = ctx;

  async function configureDefaults(store) {
    store.settings ||= {};
    store.settings.webhooks ||= {};
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "base",
        message: "Varsayılan webhook taban URL",
        default: store.settings.webhooks.default_base || "",
      },
      {
        type: "input",
        name: "token",
        message: "Varsayılan gizli anahtar/token (opsiyonel)",
        default: store.settings.webhooks.token || "",
      },
    ]);
    store.settings.webhooks.default_base = answers.base;
    store.settings.webhooks.token = answers.token;
    await writeStore(store);
    console.log(ok("Webhook ayarları kaydedildi."));
  }

  async function sendWebhook(store) {
    store.settings ||= {};
    store.settings.webhooks ||= {};
    const answers = await inquirer.prompt([
      { type: "input", name: "url", message: "Tam webhook URL (boşsa taban + event):", default: "" },
      { type: "input", name: "event", message: "Etkinlik adı", default: "toggle" },
      { type: "list", name: "method", message: "HTTP yöntemi", choices: ["POST", "GET"], default: "POST" },
      { type: "editor", name: "payload", message: "JSON payload (opsiyonel):" },
    ]);
    const base = store.settings.webhooks.default_base || "";
    const token = store.settings.webhooks.token ? `/${encodeURIComponent(store.settings.webhooks.token)}` : "";
    let targetUrl = answers.url.trim();
    if (!targetUrl) {
      if (!base) {
        console.log(err("Varsayılan taban URL tanımlı değil."));
        return;
      }
      targetUrl = `${base.replace(/\/+$/, "")}/${encodeURIComponent(answers.event)}${token}`;
    }
    const isPost = answers.method === "POST";
    const body = answers.payload && answers.payload.trim() ? answers.payload : null;
    try {
      const response = await curl(
        targetUrl,
        { "Content-Type": "application/json", Accept: "application/json" },
        20,
        isPost ? "POST" : "GET",
        body,
      );
      console.log(title("Webhook yanıtı (ilk 2KB)"));
      console.log((response || "").slice(0, 2048) || dim("(boş)"));
    } catch (error) {
      console.log(err(`Gönderilemedi: ${error.message}`));
    }
    printDivider();
  }

  async function webhookMenu() {
    const store = await readStore();
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Webhook işlemi",
        choices: [
          { name: "Webhook gönder", value: "send" },
          { name: "Varsayılan ayarları yap", value: "configure" },
          { name: "Geri", value: "back" },
        ],
      },
    ]);
    if (action === "back") return;
    if (action === "configure") {
      await configureDefaults(store);
      return;
    }
    await sendWebhook(store);
  }

  return {
    id: "webhook-sender",
    label: "Webhook gönderici",
    description: "Akıllı ev / otomasyon webhooklarını yönetir.",
    items: [{ id: "webhook-sender-run", label: "Webhook gönder", run: webhookMenu }],
  };
}


