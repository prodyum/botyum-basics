// modules/fun/coin-flip.js
// Virtual coin toss.


export function createCoinFlipGroup(ctx) {
  const { ok } = ctx;

  function flipCoin() {
    const side = Math.random() < 0.5 ? "Yazı" : "Tura";
    console.log(ok(`🪙 ${side}`));
  }

  return {
    id: "coin-flip",
    label: "Yazı tura",
    description: "Basit yazı tura atışı.",
    items: [{ id: "coin-flip-run", label: "Parayı fırlat", run: flipCoin }],
  };
}



