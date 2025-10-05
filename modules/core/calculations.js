// Description: Implements the calculations features.
export function createCalculationsGroup(ctx) {
  const { inquirer, ok, err, dim, math } = ctx;

  async function calculatorMenu() {
    console.log(dim("İpucu: birim dönüşümleri desteklenir. Örn: 5 cm + 2 inch, to(5 N*m, J)"));
    while (true) {
      const { expr } = await inquirer.prompt([
        { type: "input", name: "expr", message: "İfade (boş: çık):" },
      ]);
      if (!expr) return;
      try {
        console.log(ok(`= ${math.evaluate(expr)}`));
      } catch (error) {
        console.log(err(`Hata: ${error.message}`));
      }
    }
  }

  async function unitConversionMenu() {
    console.log(dim("Örnek: 5 cm to inch, to(5 N*m, J), 100 km/h to m/s, 37 degC to degF"));
    while (true) {
      const { expr } = await inquirer.prompt([
        { type: "input", name: "expr", message: "Dönüştürme ifadesi (boş: çık):" },
      ]);
      if (!expr) return;
      try {
        console.log(ok(String(math.evaluate(expr))));
      } catch (error) {
        console.log(err(error.message));
      }
    }
  }

  return {
    id: "calculations",
    label: "Hesaplama ve Dönüşümler",
    description: "Hesap makinesi ve birim dönüşümleri.",
    items: [
      { id: "calculator", label: "Hesap makinesi", run: calculatorMenu },
      { id: "unit-convert", label: "Birim dönüştürücü", run: unitConversionMenu },
    ],
  };
}


