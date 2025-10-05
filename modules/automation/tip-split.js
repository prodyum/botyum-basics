// Description: Implements the tip split features.

import Table from "cli-table3";

function fmtMoney(value) {
  return (Math.round(value * 100) / 100).toFixed(2);
}

export function createTipSplitGroup(ctx) {
  const { inquirer, title, printDivider } = ctx;

  async function splitBill() {
    const answers = await inquirer.prompt([
      { type: "number", name: "total", message: "Toplam hesap", default: 0 },
      { type: "number", name: "tip", message: "Bahşiş (%)", default: 10 },
      { type: "number", name: "people", message: "Kişi sayısı", default: 2 },
    ]);
    const tipAmount = answers.total * (answers.tip / 100);
    const grand = answers.total + tipAmount;
    const perPerson = grand / Math.max(1, answers.people);
    const table = new Table({ head: ["Toplam", "Bahşiş", "Genel Toplam", "Kişi Başı"] });
    table.push([
      fmtMoney(answers.total),
      fmtMoney(tipAmount),
      fmtMoney(grand),
      fmtMoney(perPerson),
    ]);
    console.log(title("Hesap bölüşme"));
    console.log(table.toString());
    printDivider();
  }

  return {
    id: "tip-split",
    label: "Hesap bölüşme",
    description: "Hesap + bahşişi kişi başına dağıtır.",
    items: [{ id: "tip-split-run", label: "Hesabı böl", run: splitBill }],
  };
}


