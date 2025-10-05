// modules/integrations/telegram.js
// Bridges telegram-cli for chat access and posting.


import { createVoiceUtils } from "../shared/workspace.js";

export function createTelegramGroup(ctx) {
  const { inquirer, ok, err, warn, exec } = ctx;
  const { hasCommand, trunc } = createVoiceUtils(ctx);

  async function telegramMenu() {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Telegram",
        choices: [
          { name: "Derin bağlantı ile mesaj", value: "link" },
          { name: "Sohbetleri listele (telegram-cli)", value: "list" },
          { name: "Sohbette son N mesaj", value: "history" },
          { name: "Geri", value: "back" },
        ],
      },
    ]);
    if (action === "back") return;
    if (action === "link") {
      const data = await inquirer.prompt([
        { type: "input", name: "to", message: "Kullanıcı adı (@kullanici)" },
        { type: "input", name: "text", message: "Mesaj" },
      ]);
      const link = `https://t.me/${data.to.replace(/^@/, "")}?text=${encodeURIComponent(data.text)}`;
      console.log(ok(link));
      return;
    }
    const haveCli = (await hasCommand("telegram-cli")) || (await hasCommand("tg"));
    if (!haveCli) {
      console.log(err("telegram-cli/tg yüklü değil."));
      return;
    }
    if (action === "list") {
      try {
        const { stdout } = await exec(`telegram-cli -W -e "dialog_list"`);
        console.log(ok("Sohbetler (ilk 2000 karakter):"));
        console.log(trunc(stdout, 2000));
      } catch (error) {
        console.log(err(`Listeleme hatası: ${error.message}`));
      }
      return;
    }
    if (action === "history") {
      const data = await inquirer.prompt([
        { type: "input", name: "dialog", message: "Sohbet adı/kullanıcı" },
        { type: "number", name: "count", message: "Kaç mesaj?", default: 20 },
      ]);
      try {
        const { stdout } = await exec(
          `telegram-cli -W -e "history ${data.dialog} ${data.count}"`,
        );
        console.log(ok("Mesajlar (ilk 2000 karakter):"));
        console.log(trunc(stdout, 2000));
      } catch (error) {
        console.log(err(`Okuma hatası: ${error.message}`));
      }
    }
  }

  return {
    id: "telegram-tools",
    label: "Telegram yardımcıları",
    description: "Derin bağlantı veya telegram-cli ile hızlı işlemler.",
    items: [{ id: "telegram-tools-run", label: "Telegram araçları", run: telegramMenu }],
  };
}




