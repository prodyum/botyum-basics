// Description: Implements the text to speech features.

export function createTextToSpeechGroup(ctx) {
  const { inquirer, ok, dim, ttsSay, readStore, writeStore } = ctx;

  async function speakText() {
    const { text } = await inquirer.prompt([{ type: "input", name: "text", message: "Seslendirilecek metin:" }]);
    if (!text) {
      console.log(dim("Seslendirilecek metin girilmedi."));
      return;
    }
    const store = await readStore();
    const enabled = store.settings?.tts_enabled ?? true;
    if (!enabled) {
      console.log(dim("TTS ayarlardan kapali. Once etkinlestirin."));
      return;
    }
    await ttsSay(text);
    console.log(ok("Seslendirildi (destekliyse)."));
  }

  return {
    id: "personal-tts",
    label: "Metni seslendir",
    description: "Platform TTS motorunu kullanir.",
    items: [{ id: "personal-tts-run", label: "Seslendir", run: speakText }],
  };
}


