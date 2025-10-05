// Description: Implements the media launcher features.

export function createMediaLauncherGroup(ctx) {
  const { inquirer, ok, open, scheduleCountdown } = ctx;

  async function handleMedia() {
    const answers = await inquirer.prompt([
      { type: "input", name: "url", message: "Medya URL / sayfa" },
      { type: "input", name: "delay", message: "Kaç saniye sonra açılsın?", default: "0" },
    ]);
    if (!answers.url) {
      console.log(ok("URL girilmedi, işlem iptal."));
      return;
    }
    const secs = parseInt(answers.delay, 10) || 0;
    if (secs > 0) {
      await scheduleCountdown(secs * 1000, `Medya aç: ${answers.url}`);
      console.log(ok(`Planlandı, ${secs} sn sonra açılacak.`));
    } else {
      await open(answers.url);
      console.log(ok("Medya açıldı."));
    }
  }

  return {
    id: "media-launcher",
    label: "Medya kısayolu",
    description: "Bağlantıları hemen veya zamanlayarak açar.",
    items: [{ id: "media-launcher-run", label: "Medya aç", run: handleMedia }],
  };
}


