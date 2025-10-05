// modules/documents/documents-browser.js
// Lists and previews files inside the documents workspace.


import fs from "fs-extra";
import path from "path";

import { createVoiceUtils } from "../shared/workspace.js";

export function createDocumentsBrowserGroup(ctx) {
  const { inquirer, ok, err, title, printDivider } = ctx;
  const { DOCS, trunc } = createVoiceUtils(ctx);

  async function browseDocuments() {
    let current = DOCS;
    while (true) {
      const entries = await fs.readdir(current, { withFileTypes: true });
      const choices = entries
        .map((entry) => ({
          name: entry.isDirectory() ? `📁 ${entry.name}` : `📄 ${entry.name}`,
          value: entry.name,
        }))
        .concat([
          { name: "⬆️ ..", value: ".." },
          { name: "Çık", value: "exit" },
        ]);
      const { pick } = await inquirer.prompt([
        { type: "list", name: "pick", message: `Dizin: ${current}`, pageSize: 20, choices },
      ]);
      if (pick === "exit") return;
      if (pick === "..") {
        const up = path.dirname(current);
        current = up.startsWith(DOCS) ? up : DOCS;
        continue;
      }
      const full = path.join(current, pick);
      const stat = await fs.stat(full);
      if (stat.isDirectory()) {
        current = full;
        continue;
      }
      let content = "";
      try {
        if (/\.pdf$/i.test(full)) {
          try {
            const { default: pdfParse } = await import("pdf-parse");
            const data = await pdfParse(await fs.readFile(full));
            content = data.text || "";
          } catch {
            content = "(PDF okumak için pdf-parse gerekli.)";
          }
        } else {
          content = await fs.readFile(full, "utf8");
        }
      } catch {
        content = "(Okunamadı)";
      }
      console.log(title(full));
      console.log(trunc(content, 5000));
      printDivider();
    }
  }

  return {
    id: "documents-browser",
    label: "Belge gezgini",
    description: "documents klasörünü gez ve içerik önizle.",
    items: [{ id: "documents-browser-run", label: "Belgeleri keşfet", run: browseDocuments }],
  };
}




