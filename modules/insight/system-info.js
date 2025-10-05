// Description: Implements the system info features.

import os from "os";

export function createSystemInfoGroup(ctx) {
  const { ok, dim, title } = ctx;

  function showSystemInfo() {
    console.log(title("Sistem Bilgisi"));
    console.log(dim("Platform:"), os.platform(), os.type(), os.arch());
    console.log(dim("İşlemci sayısı:"), os.cpus().length);
    console.log(dim("Toplam hafıza (MB):"), (os.totalmem() / 1024 / 1024).toFixed(0));
    console.log(dim("Boş hafıza (MB):"), (os.freemem() / 1024 / 1024).toFixed(0));
  }

  return {
    id: "system-info",
    label: "Sistem bilgisi",
    description: "Çalıştığı makinenin özetini gösterir.",
    items: [{ id: "system-info-run", label: "Bilgileri göster", run: showSystemInfo }],
  };
}


