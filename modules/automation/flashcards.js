// Description: Implements the flashcards features.

import Table from "cli-table3";
import { DateTime } from "luxon";

export function createFlashcardsGroup(ctx) {
  const { inquirer, ok, warn, title, dim, printDivider, readStore, writeStore } = ctx;

  async function ensureDeck(store, name) {
    store.flash ||= { decks: {} };
    store.flash.decks[name] ||= [];
    return store.flash.decks[name];
  }

  async function addCard(store) {
    const { deckName } = await inquirer.prompt([{ type: "input", name: "deckName", message: "Deste adı" }]);
    const deck = await ensureDeck(store, deckName);
    const card = await inquirer.prompt([
      { type: "editor", name: "q", message: "Soru / ön yüz" },
      { type: "editor", name: "a", message: "Cevap / arka yüz" },
    ]);
    deck.push({ q: card.q, a: card.a, box: 1, ts: DateTime.now().toISO() });
    await writeStore(store);
    console.log(ok("Kart eklendi."));
  }

  async function listDeck(store) {
    const { deckName } = await inquirer.prompt([{ type: "input", name: "deckName", message: "Deste adı" }]);
    const deck = (store.flash?.decks || {})[deckName];
    if (!deck?.length) {
      console.log(dim("Bu destede kart yok."));
      return;
    }
    const table = new Table({ head: ["#", "Kutu", "Ön yüz"] });
    deck.forEach((card, index) => {
      table.push([index + 1, card.box, (card.q.split("\n")[0] || "").slice(0, 50)]);
    });
    console.log(title(`Deste: ${deckName}`));
    console.log(table.toString());
    printDivider();
  }

  async function studyDeck(store) {
    const { deckName } = await inquirer.prompt([{ type: "input", name: "deckName", message: "Deste adı" }]);
    const deck = (store.flash?.decks || {})[deckName];
    if (!deck?.length) {
      console.log(warn("Bu destede kart yok."));
      return;
    }
    const pool = [...deck].sort((a, b) => a.box - b.box).slice(0, 20);
    for (const card of pool) {
      console.log(title("Ön"));
      console.log(card.q);
      await inquirer.prompt([{ type: "input", name: "_", message: dim("(devam için Enter)") }]);
      console.log(ok("Arka"));
      console.log(card.a);
      const { verdict } = await inquirer.prompt([
        { type: "list", name: "verdict", message: "Bildiğinizi değerlendir", choices: ["Bilemedim", "Zorlandım", "Bildim"] },
      ]);
      if (verdict === "Bildim" && card.box < 5) card.box += 1;
      if (verdict === "Bilemedim") card.box = 1;
      card.ts = DateTime.now().toISO();
    }
    await writeStore(store);
    console.log(ok("Çalışma kaydedildi."));
  }

  async function deleteDeck(store) {
    const { deckName } = await inquirer.prompt([{ type: "input", name: "deckName", message: "Silinecek deste" }]);
    if (store.flash?.decks?.[deckName]) {
      delete store.flash.decks[deckName];
      await writeStore(store);
      console.log(ok("Silindi."));
    } else {
      console.log(warn("Deste bulunamadı."));
    }
  }

  async function flashcardsMenu() {
    const store = await readStore();
    store.flash ||= { decks: {} };
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Flash kartlar",
        choices: [
          { name: "Kart ekle", value: "add" },
          { name: "Kartları listele", value: "list" },
          { name: "Çalış", value: "study" },
          { name: "Deste sil", value: "delete" },
          { name: "Geri", value: "back" },
        ],
      },
    ]);
    if (action === "back") return;
    if (action === "add") await addCard(store);
    else if (action === "list") await listDeck(store);
    else if (action === "study") await studyDeck(store);
    else if (action === "delete") await deleteDeck(store);
  }

  return {
    id: "flashcards",
    label: "Flash kartlar",
    description: "Leitner metoduyla kart çalışmanızı takip eder.",
    items: [{ id: "flashcards-run", label: "Kartları yönet", run: flashcardsMenu }],
  };
}


