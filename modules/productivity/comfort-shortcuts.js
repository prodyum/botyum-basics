// Description: Implements the comfort shortcuts features.

export function createComfortShortcutsGroup(ctx) {
  const { warn } = ctx;

  async function showMessage() {
    console.log(warn("Konfor kısayolları henüz uygulanmadı."));
  }

  return {
    id: "comfort-shortcuts",
    label: "Konfor kısayolları",
    description: "Dinlenme ve konfor rutinleri (planlanacak).",
    items: [{ id: "comfort-shortcuts-info", label: "Durum", run: showMessage }],
  };
}


