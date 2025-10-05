// Description: Implements the password generator features.

import { randomPassword, randomWords } from "./utils.js";

export function createPasswordGeneratorGroup(ctx) {
  const { inquirer, ok, printDivider } = ctx;

  async function generatePassword() {
    const answers = await inquirer.prompt([
      { type: "number", name: "length", message: "Uzunluk", default: 16 },
      { type: "confirm", name: "symbols", message: "Semboller kullanılsın mı?", default: true },
      { type: "confirm", name: "passphrase", message: "Kelime bazlı geçiş cümlesi üret?", default: false },
    ]);
    if (answers.passphrase) {
      const words = randomWords(6).join("-");
      console.log(ok(`Geçiş cümlesi: ${words}`));
    } else {
      const pwd = randomPassword(answers.length, answers.symbols);
      console.log(ok(`Şifre: ${pwd}`));
    }
    printDivider();
  }

  return {
    id: "password-generator",
    label: "Şifre üretici",
    description: "Rastgele şifre veya geçiş cümlesi oluşturur.",
    items: [{ id: "password-generator-run", label: "Şifre üret", run: generatePassword }],
  };
}


