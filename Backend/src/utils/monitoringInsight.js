const PATTERN_INSIGHTS = {
  surge: {
    reason: "Pressure dan flow rate berada di atas median + 1,5 IQR pada eksekusi ini.",
    impact: "Kenaikan serentak ini adalah pola snapshot yang konsisten dengan surge-like; osilasi tekanan tetap perlu deret waktu kontinu untuk dibuktikan.",
  },
  leak: {
    reason: "Pressure berada di bawah median - 1 IQR dan flow rate di bawah median - 0,5 IQR pada eksekusi ini.",
    impact: "Pola ini adalah aturan klasifikasi penelitian yang dapat konsisten dengan leak-like, bukan bukti kebocoran fisik secara pasti.",
  },
  blockage: {
    reason: "Pressure berada di atas median + 1 IQR sedangkan flow rate di bawah median - 0,5 IQR pada eksekusi ini.",
    impact: "Kombinasi pressure tinggi dan flow rendah dapat konsisten dengan blockage-like, tetapi perlu data valve atau tekanan hulu-hilir untuk konfirmasi.",
  },
  degradation: {
    reason: "Observasi anomali ini tidak memenuhi tiga aturan pola pressure-flow lain sehingga ditempatkan pada kategori fallback degradation.",
    impact: "Kategori fallback bukan bukti degradasi bertahap; kesimpulan degradasi memerlukan tren waktu dan variabel kondisi tambahan.",
  },
};

const getMonitoringInsight = (item) => {
  const algorithmLabel = String(item.type || "anomaly").toLowerCase();

  if (item.is_normal_from_algo || algorithmLabel === "normal") {
    return {
      prediction: "Normal",
      severity: "Safe",
      pattern: "normal",
      reason: "Observasi ini tidak ditandai sebagai anomali oleh hasil eksekusi algoritma.",
      impact: "Status ini hanya berlaku pada dataset dan konfigurasi model yang dipilih; bukan pernyataan kondisi operasi nyata.",
      solution: "Gunakan sebagai pembanding hasil model dan dokumentasikan konfigurasi eksekusinya.",
    };
  }

  const pattern = PATTERN_INSIGHTS[algorithmLabel] || PATTERN_INSIGHTS.degradation;

  return {
    prediction: "Anomaly",
    severity: "Medium",
    pattern: algorithmLabel in PATTERN_INSIGHTS ? algorithmLabel : "degradation",
    reason: pattern.reason,
    impact: pattern.impact,
    solution: "Tinjau observasi berdekatan, status valve, dan label event_type dataset sebelum menyimpulkan kondisi fisik.",
  };
};

module.exports = { getMonitoringInsight };
