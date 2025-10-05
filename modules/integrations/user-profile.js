// modules/integrations/user-profile.js
// Manages local user profile details for other modules.


export function createUserProfileGroup(ctx) {
  const { inquirer, ok, title, dim, readStore, writeStore } = ctx;

  const fields = [
    ["name", "Adı"],
    ["dob", "Doğum tarihi (ISO)"],
    ["pob", "Doğum yeri"],
    ["work", "Çalıştığı yer"],
    ["nick", "Lakabı"],
    ["email", "E-posta"],
    ["phone", "Telefon"],
    ["address", "Ev adresi"],
  ];

  async function manageProfile() {
    const store = await readStore();
    store.profile ||= {};
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Profil",
        choices: ["Güncelle", "Görüntüle", "Sil", "Geri"],
      },
    ]);
    if (action === "Geri") return;
    if (action === "Güncelle") {
      const updates = {};
      for (const [key, label] of fields) {
        const answer = await inquirer.prompt([
          { type: "input", name: key, message: `${label}:`, default: store.profile[key] || "" },
        ]);
        updates[key] = answer[key];
      }
      store.profile = updates;
      await writeStore(store);
      console.log(ok("Kaydedildi."));
      return;
    }
    if (action === "Görüntüle") {
      console.log(title("Kullanıcı Profili"));
      if (!Object.keys(store.profile).length) {
        console.log(dim("Boş"));
      } else {
        Object.entries(store.profile).forEach(([key, value]) => {
          console.log(`${key}: ${value || "-"}`);
        });
      }
      return;
    }
    if (action === "Sil") {
      store.profile = {};
      await writeStore(store);
      console.log(ok("Temizlendi."));
    }
  }

  return {
    id: "user-profile",
    label: "Kullanıcı profili",
    description: "Yerel profili saklar ve gösterir.",
    items: [{ id: "user-profile-run", label: "Profili yönet", run: manageProfile }],
  };
}




