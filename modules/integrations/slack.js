// modules/integrations/slack.js
// Interacts with Slack APIs for messaging utilities.


export function createSlackGroup(ctx) {
  const { inquirer, ok, err, warn, dim, curl, readStore, writeStore } = ctx;

  async function manageSlack() {
    const store = await readStore();
    store.slack ||= { token: process.env.SLACK_TOKEN || "" };
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Slack",
        choices: [
          "Token ayarla",
          "Kanalları listele",
          "Kanala mesaj gönder",
          "Kanalda son N mesajı oku",
          "Geri",
        ],
      },
    ]);
    if (action === "Geri") return;
    if (action === "Token ayarla") {
      const { token } = await inquirer.prompt([
        {
          type: "password",
          name: "token",
          message: "Slack Bot/User OAuth Token (xoxb-.. / xoxp-..)",
          mask: "*",
          default: store.slack.token,
        },
      ]);
      store.slack.token = token;
      await writeStore(store);
      console.log(ok("Kaydedildi."));
      return;
    }
    const token = store.slack.token || process.env.SLACK_TOKEN;
    if (!token) {
      console.log(err("Önce token ayarla."));
      return;
    }
    if (action === "Kanalları listele") {
      try {
        const response = await curl(
          "https://slack.com/api/conversations.list?limit=50",
          { Authorization: `Bearer ${token}`, Accept: "application/json" },
          20,
        );
        const json = JSON.parse(response);
        (json.channels || []).forEach((channel) => {
          console.log(`${ok(channel.id)} ${channel.name} ${dim(channel.is_private ? "(private)" : "")}`);
        });
      } catch (error) {
        console.log(err(`Slack hata: ${error.message}`));
      }
      return;
    }
    if (action === "Kanala mesaj gönder") {
      const input = await inquirer.prompt([
        { type: "input", name: "channel", message: "Kanal ID (C…/G…)" },
        { type: "editor", name: "text", message: "Mesaj" },
      ]);
      try {
        const response = await curl(
          "https://slack.com/api/chat.postMessage",
          { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          20,
          "POST",
          JSON.stringify({ channel: input.channel, text: input.text }),
        );
        const json = JSON.parse(response);
        console.log(json.ok ? ok("Gönderildi.") : err(`Gönderilemedi: ${json.error}`));
      } catch (error) {
        console.log(err(`Slack hata: ${error.message}`));
      }
      return;
    }
    if (action === "Kanalda son N mesajı oku") {
      const input = await inquirer.prompt([
        { type: "input", name: "channel", message: "Kanal ID" },
        { type: "number", name: "count", message: "Kaç mesaj?", default: 10 },
      ]);
      try {
        const response = await curl(
          `https://slack.com/api/conversations.history?channel=${encodeURIComponent(input.channel)}&limit=${input.count}`,
          { Authorization: `Bearer ${token}`, Accept: "application/json" },
          20,
        );
        const json = JSON.parse(response);
        (json.messages || []).forEach((message, idx) => {
          console.log(`${ok(String(idx + 1).padStart(2, "0"))}) ${message.user || message.username || "-"}: ${message.text?.slice(0, 200) || ""}`);
        });
      } catch (error) {
        console.log(err(`Slack hata: ${error.message}`));
      }
    }
  }

  return {
    id: "slack-tools",
    label: "Slack entegrasyonu",
    description: "Token yönetimi, kanal listesi ve mesajlaşma.",
    items: [{ id: "slack-tools-run", label: "Slack araçlarını aç", run: manageSlack }],
  };
}




