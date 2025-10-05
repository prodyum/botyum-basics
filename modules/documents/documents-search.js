// modules/documents/documents-search.js
// Searches document names and contents within the workspace.


import fs from "fs-extra";
import path from "path";

import { createVoiceUtils } from "../shared/workspace.js";

export function createDocumentsSearchGroup(ctx) {
  const { inquirer, ok, err, exec } = ctx;
  const { DOCS, hasCommand } = createVoiceUtils(ctx);

  async function walkFiles(dir, out = []) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkFiles(full, out);
      } else {
        out.push(full);
      }
    }
    return out;
  }

  async function searchDocuments() {
    const { keyword } = await inquirer.prompt([
      { type: "input", name: "keyword", message: "Anahtar kelime" },
    ]);
    if (!keyword) return;
    const files = await walkFiles(DOCS);
    for (const file of files) {
      let text = "";
      try {
        if (/\.pdf$/i.test(file)) {
          try {
            const { default: pdfParse } = await import("pdf-parse");
            const data = await pdfParse(await fs.readFile(file));
            text = data.text || "";
          } catch {
            // ignore
          }
        } else if (/\.(txt|md|csv)$/i.test(file)) {
          text = await fs.readFile(file, "utf8");
        } else if (/\.docx$/i.test(file)) {
          try {
            if (await hasCommand("unzip")) {
              const { stdout } = await exec(`unzip -p "${file}" word/document.xml`);
              text = stdout.replace(/<[^>]+>/g, " ");
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
      if (!text) continue;
      const lines = text.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(keyword.toLowerCase())) {
          console.log(ok(`${file}:${index + 1}`));
          console.log(`  ${line.slice(0, 200)}`);
        }
      });
    }
  }

  return {
    id: "documents-search",
    label: "Belge arama",
    description: "documents klasöründe anahtar kelime araması yapar.",
    items: [{ id: "documents-search-run", label: "Belge ara", run: searchDocuments }],
  };
}




