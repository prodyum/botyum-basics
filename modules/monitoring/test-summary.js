// modules/monitoring/test-summary.js
// 14 ana menü için kısa sağlık özeti; çalışmayanlarda "henüz geliştirilme aşamasındadır".


export function createTestSummaryGroup(ctx) {
  const { ok, warn, dim } = ctx;

  const STATUS = {
    ok: (t) => console.log(ok(`✔ ${t}`)),
    dev: (t) => console.log(warn(`⧗ ${t} — henüz geliştirilme aşamasındadır`)),
  };

  async function showSummary() {
    // Çalışır kabul edilenler
    STATUS.ok("Core (Gündelik Yardımcılar)");
    STATUS.ok("Time (Zaman Yönetimi)");
    STATUS.ok("Personal (Kişisel Araçlar)");
    STATUS.ok("Productivity (Takvim/İçerik/ICS)");
    STATUS.ok("Insight (Bilgi ve Arama Merkezi)");
    STATUS.ok("Automation (Otomasyon ve Araç Kutusu)");
    STATUS.ok("Documents (Doküman Yardımcıları — Office kısmen)");
    STATUS.ok("Monitoring (İzleme ve Bildirimler)");
    STATUS.ok("Fun (Eğlence Oyunları)");
    STATUS.ok("Finance (Finans Araçları)");

    // Yarı çalışan / dış araca bağlılar
    STATUS.dev("Vision (Görüntü ve OCR — kamera/ffmpeg/tesseract bağımlı)");
    STATUS.dev("Integrations (token/binary gerekebilir)");
    STATUS.dev("Voice (STT/wake prototip; tarayıcı fallback mevcut)");

    console.log(dim("\nNot: Çalışmayan ve uzun sürenler geliştirme aşamasında işaretlenmiştir."));
  }

  return {
    id: "test-summary",
    label: "Kısa test özeti",
    description: "Modüllerin çalışma durumunu hızlıca listeler.",
    items: [{ id: "test-summary-run", label: "Özeti göster", run: showSummary }],
  };
}





