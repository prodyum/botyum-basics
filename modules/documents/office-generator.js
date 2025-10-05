// modules/documents/office-generator.js
// Generates Office documents via LibreOffice automation.


import fs from "fs-extra";
import path from "path";

import { createVoiceUtils } from "../shared/workspace.js";

export function createOfficeGeneratorGroup(ctx) {
  const { inquirer, ok, warn, err, exec } = ctx;
  const { TMP, BASE, hasCommand } = createVoiceUtils(ctx);

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function convertWithSoffice(src, target) {
    const have = await hasCommand("soffice");
    if (!have) {
      await fs.copyFile(src, target.replace(/\.(docx|xlsx|pptx)$/i, ".html"));
      console.log(warn("LibreOffice bulunamadı; HTML yedeği oluşturuldu."));
      return;
    }
    try {
      await exec(
        `soffice --headless --convert-to ${path.extname(target).slice(1)} --outdir "${path.dirname(target)}" "${src}"`,
      );
      const produced = path.join(
        path.dirname(target),
        path.basename(src).replace(/\.\w+$/, path.extname(target)),
      );
      if (await fs.pathExists(produced)) {
        await fs.rename(produced, target);
      }
    } catch (error) {
      console.log(err(`LibreOffice dönüştürme hatası: ${error.message}`));
    }
  }

  async function generateDocument() {
    const documentsDir = path.join(BASE, "documents");
    await fs.ensureDir(documentsDir);
    const { choice } = await inquirer.prompt([
      {
        type: "list",
        name: "choice",
        message: "Belge türü",
        choices: ["Word (.docx)", "Excel (.xlsx)", "PowerPoint (.pptx)"],
      },
    ]);
    const { title } = await inquirer.prompt([
      { type: "input", name: "title", message: "Başlık/kapak metni" },
    ]);
    if (choice.startsWith("Word")) {
      const html = `<!doctype html><meta charset="utf-8"><h1>${escapeHtml(title)}</h1><p>${new Date().toISOString()}</p>`;
      const tmp = path.join(TMP, `doc-${Date.now()}.html`);
      await fs.writeFile(tmp, html, "utf8");
      const target = path.join(documentsDir, `doc-${Date.now()}.docx`);
      await convertWithSoffice(tmp, target);
      console.log(ok(`Oluşturuldu: ${target}`));
      return;
    }
    if (choice.startsWith("Excel")) {
      const csv = `Başlık,Değer\nZaman,${new Date().toISOString()}\nNot,${title}\n`;
      const tmp = path.join(TMP, `sheet-${Date.now()}.csv`);
      await fs.writeFile(tmp, csv, "utf8");
      const target = path.join(documentsDir, `sheet-${Date.now()}.xlsx`);
      await convertWithSoffice(tmp, target);
      console.log(ok(`Oluşturuldu: ${target}`));
      return;
    }
    const html = `<!doctype html><meta charset="utf-8"><h1>${escapeHtml(title)}</h1><h2>botyum sunum</h2>`;
    const tmp = path.join(TMP, `slides-${Date.now()}.html`);
    await fs.writeFile(tmp, html, "utf8");
    const target = path.join(documentsDir, `slides-${Date.now()}.pptx`);
    await convertWithSoffice(tmp, target);
    console.log(ok(`Oluşturuldu: ${target}`));
  }

  return {
    id: "office-generator",
    label: "Office belge üretimi",
    description: "LibreOffice kullanarak DOCX/XLSX/PPTX üretir.",
    items: [{ id: "office-generator-run", label: "Belge oluştur", run: generateDocument }],
  };
}





