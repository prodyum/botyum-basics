// Description: Implements the email digest features.

export function createEmailDigestGroup(ctx) {
  const { inquirer, ok, err, warn, title, printDivider, readStore, writeStore } = ctx;

  async function configureEmail(store) {
    const answers = await inquirer.prompt([
      { type: "input", name: "host", message: "IMAP sunucu:" },
      { type: "number", name: "port", message: "Port:", default: 993 },
      { type: "confirm", name: "tls", message: "TLS kullanılsın mı?", default: true },
      { type: "input", name: "user", message: "Kullanıcı e-posta:" },
      { type: "input", name: "pass", message: "Parola / uygulama şifresi:" },
    ]);
    store.email = answers;
    await writeStore(store);
    console.log(ok("IMAP ayarları kaydedildi."));
  }

  async function fetchDigest(store) {
    if (!store.email?.host) {
      console.log(err("Önce IMAP ayarlarını yapılandırın."));
      return;
    }
    try {
      const { Inbox } = await import("imapflow");
      const client = new Inbox({
        host: store.email.host,
        port: store.email.port,
        secure: store.email.tls,
        auth: { user: store.email.user, pass: store.email.pass },
      });
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");
      try {
        const messages = await client.listMessages("INBOX", "1:*", { uid: true, subject: true, from: true, date: true });
        const last = messages.slice(-5);
        if (!last.length) {
          console.log(warn("Görüntülenecek e-posta yok."));
        } else {
          console.log(title("Son 5 e-posta"));
          last.forEach((message) => {
            console.log(`${ok(message.date)} | ${message.from} | ${message.subject}`);
          });
          printDivider();
        }
      } finally {
        lock.release();
      }
      await client.logout();
    } catch (error) {
      console.log(err(`E-posta okunamadı: ${error.message}`));
    }
  }

  async function emailDigestMenu() {
    const store = await readStore();
    store.email ||= {};
    const { action } = await inquirer.prompt([
      { type: "list", name: "action", message: "E-posta özeti", choices: ["Ayarla", "Son mesajları getir", "Geri"] },
    ]);
    if (action === "Geri") return;
    if (action === "Ayarla") {
      await configureEmail(store);
      return;
    }
    await fetchDigest(store);
  }

  return {
    id: "email-digest",
    label: "E-posta özeti",
    description: "IMAP kutunuzdaki son iletileri gösterir.",
    items: [{ id: "email-digest-run", label: "Özet al", run: emailDigestMenu }],
  };
}


