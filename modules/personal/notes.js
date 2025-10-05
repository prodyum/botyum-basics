// Description: Implements the notes features.

export function createNotesGroup(ctx) {
  const { inquirer, ok, err, dim, title, printDivider, readStore, writeStore } = ctx;

  async function addNote() {
    const { text } = await inquirer.prompt([{ type: "editor", name: "text", message: "Not icerigi:" }]);
    if (!text) {
      console.log(dim("Not olusturma iptal edildi."));
      return;
    }
    const store = await readStore();
    store.notes ||= [];
    store.notes.push({ id: Date.now(), text });
    await writeStore(store);
    console.log(ok("Not eklendi."));
  }

  async function listNotes() {
    const store = await readStore();
    const notes = store.notes || [];
    if (!notes.length) {
      console.log(dim("Kayitli not bulunmuyor."));
      return;
    }
    console.log(title("Notlar"));
    notes.forEach((note, index) => {
      console.log(`${ok(String(index + 1).padStart(2, "0"))}) ${note.text.split("\n")[0]}`);
    });
    printDivider();
  }

  async function deleteNote() {
    const store = await readStore();
    const notes = store.notes || [];
    if (!notes.length) {
      console.log(dim("Silinecek not yok."));
      return;
    }
    const { idx } = await inquirer.prompt([{ type: "number", name: "idx", message: "Silinecek not numarasi" }]);
    const index = Number(idx) - 1;
    if (Number.isNaN(index) || index < 0 || index >= notes.length) {
      console.log(err("Gecerli bir numara gir."));
      return;
    }
    notes.splice(index, 1);
    store.notes = notes;
    await writeStore(store);
    console.log(ok("Not silindi."));
  }

  return {
    id: "personal-notes",
    label: "Not defteri",
    description: "Not ekleme, listeleme ve silme islemleri.",
    items: [
      { id: "personal-notes-add", label: "Not ekle", run: addNote },
      { id: "personal-notes-list", label: "Notlari listele", run: listNotes },
      { id: "personal-notes-delete", label: "Not sil", run: deleteNote },
    ],
  };
}


