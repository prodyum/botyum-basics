// modules/fun/dice.js
// Single and double dice rolls.


export function createDiceGamesGroup(ctx) {
  const { ok } = ctx;

  function rollSingleDie() {
    const value = Math.floor(Math.random() * 6) + 1;
    console.log(ok(`🎲 ${value}`));
  }

  function rollDoubleDice() {
    const a = Math.floor(Math.random() * 6) + 1;
    const b = Math.floor(Math.random() * 6) + 1;
    console.log(ok(`🎲 ${a} + ${b} = ${a + b}`));
  }

  return {
    id: "dice-games",
    label: "Zar oyunları",
    description: "Tek veya çift zar atma.",
    items: [
      { id: "dice-single", label: "Tek zar at", run: rollSingleDie },
      { id: "dice-double", label: "Çift zar at", run: rollDoubleDice },
    ],
  };
}



