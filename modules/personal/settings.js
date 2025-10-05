// Description: Implements the settings features.

export function createPersonalSettingsGroup(ctx) {
  const { inquirer, ok, readStore, writeStore } = ctx;

  async function updateSettings() {
    const store = await readStore();
    store.settings ||= { libretranslate_url: "https://libretranslate.de", tts_enabled: true };
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Hangi ayari degistirmek istersiniz?",
        choices: [
          { name: "LibreTranslate URL", value: "lt" },
          { name: "TTS ac/kapat", value: "tts" },
          { name: "Iptal", value: "cancel" },
        ],
      },
    ]);
    if (action === "cancel") {
      return;
    }
    if (action === "lt") {
      const { url } = await inquirer.prompt([{ type: "input", name: "url", message: "Yeni LibreTranslate URL" }]);
      store.settings.libretranslate_url = url || store.settings.libretranslate_url;
    }
    if (action === "tts") {
      store.settings.tts_enabled = !store.settings.tts_enabled;
    }
    await writeStore(store);
    console.log(ok("Ayarlar guncellendi."));
  }

  return {
    id: "personal-settings",
    label: "Kisisel ayarlar",
    description: "Ceviri URL ve TTS tercihleriniz.",
    items: [{ id: "personal-settings-update", label: "Ayar degistir", run: updateSettings }],
  };
}


