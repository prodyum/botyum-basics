// Description: Implements the todos features.

export function createTodosGroup(ctx) {
  const { inquirer, ok, err, dim, readStore, writeStore } = ctx;

  async function addTodo() {
    const { text } = await inquirer.prompt([{ type: "input", name: "text", message: "Gorev:" }]);
    if (!text) {
      console.log(dim("Gorev eklenmedi."));
      return;
    }
    const store = await readStore();
    store.todos ||= [];
    store.todos.push({ id: Date.now(), text, done: false });
    await writeStore(store);
    console.log(ok("Gorev eklendi."));
  }

  async function markDone() {
    const store = await readStore();
    const todos = store.todos || [];
    if (!todos.length) {
      console.log(dim("Gorev listesi bos."));
      return;
    }
    const { idx } = await inquirer.prompt([{ type: "number", name: "idx", message: "Tamamlanan gorev numarasi" }]);
    const index = Number(idx) - 1;
    if (Number.isNaN(index) || index < 0 || index >= todos.length) {
      console.log(err("Gecerli bir numara gir."));
      return;
    }
    todos[index].done = true;
    await writeStore(store);
    console.log(ok("Gorev tamamlandi."));
  }

  async function listTodos() {
    const store = await readStore();
    const todos = store.todos || [];
    if (!todos.length) {
      console.log(dim("Kayitli gorev yok."));
      return;
    }
    todos.forEach((todo, index) => {
      const status = todo.done ? "[x]" : "[ ]";
      console.log(`${status} ${ok(String(index + 1).padStart(2, "0"))}) ${todo.text}`);
    });
  }

  async function deleteTodo() {
    const store = await readStore();
    const todos = store.todos || [];
    if (!todos.length) {
      console.log(dim("Silinecek gorev yok."));
      return;
    }
    const { idx } = await inquirer.prompt([{ type: "number", name: "idx", message: "Silinecek gorev numarasi" }]);
    const index = Number(idx) - 1;
    if (Number.isNaN(index) || index < 0 || index >= todos.length) {
      console.log(err("Gecerli bir numara gir."));
      return;
    }
    todos.splice(index, 1);
    store.todos = todos;
    await writeStore(store);
    console.log(ok("Gorev silindi."));
  }

  return {
    id: "personal-todos",
    label: "Yapilacaklar",
    description: "Gorev ekle, takip et ve yonet.",
    items: [
      { id: "personal-todos-add", label: "Gorev ekle", run: addTodo },
      { id: "personal-todos-done", label: "Gorev tamamla", run: markDone },
      { id: "personal-todos-list", label: "Gorevleri listele", run: listTodos },
      { id: "personal-todos-delete", label: "Gorev sil", run: deleteTodo },
    ],
  };
}


