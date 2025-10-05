// Description: Implements the file finder features.

import fs from "fs-extra";
import path from "path";
import Table from "cli-table3";
import { DateTime } from "luxon";

export function createFileFinderGroup(ctx) {
  const { inquirer, ok, err, title, printDivider } = ctx;

  async function findFiles() {
    const answers = await inquirer.prompt([
      { type: "input", name: "dir", message: "Klasör", default: process.cwd() },
      { type: "input", name: "name", message: "İsimde geçmesi gereken ifade", default: "" },
      { type: "number", name: "days", message: "Kaç gün içinde değişenler (0=hepsi)", default: 0 },
    ]);
    try {
      const entries = await fs.readdir(answers.dir, { withFileTypes: true });
      const now = Date.now();
      const rows = [];
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (answers.name && !entry.name.toLowerCase().includes(answers.name.toLowerCase())) continue;
        const fullPath = path.join(answers.dir, entry.name);
        const stats = await fs.stat(fullPath);
        if (answers.days > 0) {
          const ageDays = (now - stats.mtimeMs) / (24 * 3600 * 1000);
          if (ageDays > answers.days) continue;
        }
        rows.push({ name: entry.name, size: stats.size, mtime: stats.mtime });
      }
      rows.sort((a, b) => b.mtime - a.mtime);
      const table = new Table({ head: ["Dosya", "Boyut (KB)", "Değişiklik"] });
      rows.slice(0, 30).forEach((row) => {
        table.push([
          row.name,
          (row.size / 1024).toFixed(1),
          DateTime.fromJSDate(row.mtime).toFormat("yyyy-MM-dd HH:mm"),
        ]);
      });
      console.log(title("Dosya Bulucu (ilk 30)"));
      console.log(table.toString());
      printDivider();
    } catch (error) {
      console.log(err(`Okuma hatası: ${error.message}`));
    }
  }

  return {
    id: "file-finder",
    label: "Dosya bulucu",
    description: "Belirli kriterlere göre klasör taraması yapar.",
    items: [{ id: "file-finder-run", label: "Dosyaları listele", run: findFiles }],
  };
}


