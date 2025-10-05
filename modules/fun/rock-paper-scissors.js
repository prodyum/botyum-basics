// modules/fun/rock-paper-scissors.js
// Play rock-paper-scissors against the computer.


export function createRockPaperScissorsGroup(ctx) {
  const { inquirer, ok, err, warn, dim } = ctx;

  async function playGame() {
    const choices = ["Taş", "Kağıt", "Makas"];
    const { user } = await inquirer.prompt([
      { type: "list", name: "user", message: "Seçimin", choices },
    ]);
    const cpu = choices[Math.floor(Math.random() * 3)];
    console.log(dim(`Bilgisayar: ${cpu}`));
    if (user === cpu) {
      console.log(warn("Berabere!"));
    } else if (
      (user === "Taş" && cpu === "Makas") ||
      (user === "Kağıt" && cpu === "Taş") ||
      (user === "Makas" && cpu === "Kağıt")
    ) {
      console.log(ok("Kazandın!"));
    } else {
      console.log(err("Kaybettin!"));
    }
  }

  return {
    id: "rock-paper-scissors",
    label: "Taş kağıt makas",
    description: "Klasik Taş-Kağıt-Makas oyunu.",
    items: [{ id: "rock-paper-scissors-run", label: "Oyna", run: playGame }],
  };
}



