// modules/integrations/quick-text.js
// Stores reusable text snippets for quick responses.


import path from "path";
import fs from "fs-extra";

import { createVoiceUtils } from "../shared/workspace.js";

export function createQuickTextGroup(ctx) {
  const { inquirer, ok } = ctx;
  const { BASE } = createVoiceUtils(ctx);

  async function createTextFile() {
    const dir = path.join(BASE, "documents");
    await fs.ensureDir(dir);
    const answers = await inquirer.prompt([
      { type: "input", name: "name", message: "Dosya adı", default: `note-${Date.now()}` },
      { type: "editor", name: "body", message: "Metin" },
    ]);
    const file = path.join(dir, `${answers.name}.txt`);
    await fs.writeFile(file, answers.body || "", "utf8");
    console.log(ok(`Oluşturuldu: ${file}`));
  }

  return {
    id: "quick-text",
    label: "Hızlı metin",
    description: "documents klasöründe hızlı not oluşturur.",
    items: [{ id: "quick-text-run", label: "Metin dosyası oluştur", run: createTextFile }],
  };
}




