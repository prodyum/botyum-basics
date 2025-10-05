// modules/fun/random-number.js
// Pick a random number within bounds.


export function createRandomNumberGroup(ctx) {
  const { inquirer, ok, err } = ctx;

  async function pickNumber() {
    const { min, max } = await inquirer.prompt([
      { type: "number", name: "min", message: "Alt sınır", default: 1 },
      { type: "number", name: "max", message: "Üst sınır", default: 100 },
    ]);
    if (Number.isNaN(min) || Number.isNaN(max) || max < min) {
      console.log(err("Geçersiz aralık."));
      return;
    }
    const value = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(ok(`🎯 ${value}`));
  }

  return {
    id: "random-number",
    label: "Rastgele sayı",
    description: "Belirlediğiniz aralıkta rastgele sayı üretir.",
    items: [{ id: "random-number-run", label: "Sayı seç", run: pickNumber }],
  };
}



