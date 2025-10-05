// modules/finance/percentage.js
// Percentage and VAT calculations.


export function createPercentageCalculatorGroup(ctx) {
  const { inquirer, ok, err, warn } = ctx;

  async function calculate() {
    const { expr } = await inquirer.prompt([
      { type: "input", name: "expr", message: "İfade (örn: 200 TL'nin %15'i)" },
    ]);
    if (!expr) return;
    const num = parseFloat(expr.replace(/[, ]+/g, " ").match(/(\d+(\.\d+)?)/)?.[0] || "NaN");
    const percMatch = expr.match(/(\d+(\.\d+)?)\s*%/);
    if (Number.isNaN(num) || !percMatch) {
      console.log(warn("Basit yüzde/KDV örneklerini destekler. İfadeyi sadeleştirin."));
      return;
    }
    const perc = parseFloat(percMatch[1]);
    if (/kdv/i.test(expr)) {
      const result = num * (1 + perc / 100);
      console.log(ok(`${num} + %${perc} KDV = ${result.toFixed(2)}`));
    } else {
      const result = (num * perc) / 100;
      console.log(ok(`%${perc} of ${num} = ${result}`));
    }
  }

  return {
    id: "percentage-calculator",
    label: "Yüzde/KDV hesaplayıcı",
    description: "Basit yüzde ve KDV hesaplamaları yapar.",
    items: [{ id: "percentage-calculator-run", label: "Hesapla", run: calculate }],
  };
}



