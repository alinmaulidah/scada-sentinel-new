const getMonitoringInsight = (item) => {
  const pressure = Number(item.pressure || 0);
  const flow = Number(item.flow_rate || 0);
  const temperature = Number(item.temperature || 0);
  const speed = Number(item.pump_speed || 0);
  const type = String(item.type || "").toLowerCase();

  if (item.is_normal_from_algo || type === "normal") {
    return {
      prediction: "Normal",
      severity: "Safe",
      reason: "Seluruh parameter sensor berada pada rentang operasional aman.",
      impact: "Sistem distribusi pipa berjalan stabil tanpa indikasi fluktuasi anomali.",
      solution: "Lanjutkan monitoring berkala dan preventive maintenance sesuai jadwal.",
    };
  }

  if (type === "leak" || (pressure < 2.5 && flow > 8)) {
    return {
      prediction: "Leak",
      severity: "High",
      reason: `Tekanan drop kritis (${pressure.toFixed(2)} Bar) dengan perubahan aliran (${flow.toFixed(1)} m³/h).`,
      impact: "Risiko kehilangan komoditas, pencemaran, dan gangguan pasokan hilir.",
      solution: "Isolasi block valve terdekat, turunkan RPM pompa, dan lakukan inspeksi lapangan.",
    };
  }

  if (type === "surge" || (pressure > 5.5 && speed > 1600)) {
    return {
      prediction: "Surge",
      severity: "High",
      reason: `Lonjakan tekanan (${pressure.toFixed(2)} Bar) dengan kecepatan pompa tinggi (${speed} RPM).`,
      impact: "Risiko tekanan melampaui MAOP dan kerusakan mekanis pipa.",
      solution: "Turunkan RPM, aktifkan bypass bila diperlukan, dan periksa surge relief system.",
    };
  }

  if (type === "blockage" || (pressure > 4.5 && flow < 3)) {
    return {
      prediction: "Blockage",
      severity: "High",
      reason: `Tekanan hulu tinggi (${pressure.toFixed(2)} Bar) dengan aliran rendah (${flow.toFixed(1)} m³/h).`,
      impact: "Risiko hambatan mekanis di pipa dan beban berlebih pada pompa.",
      solution: "Periksa valve, jadwalkan pembersihan pipa, dan validasi kondisi mekanis.",
    };
  }

  if (type === "degradation" || temperature > 65 || (speed > 1500 && flow < 6)) {
    return {
      prediction: "Degradation",
      severity: "Medium",
      reason: `Suhu (${temperature.toFixed(1)} °C) atau beban pompa (${speed} RPM) menunjukkan penurunan efisiensi.`,
      impact: "Risiko penurunan performa mekanis dan keausan komponen.",
      solution: "Periksa bearing, heat exchanger, dan kalibrasi instrumen.",
    };
  }

  return {
    prediction: "Anomaly",
    severity: "Medium",
    reason: "Parameter berada di luar pola klaster normal.",
    impact: "Berpotensi menandakan ketidakstabilan operasi atau gangguan sensor.",
    solution: "Validasi silang data dan lakukan monitoring lanjutan.",
  };
};

module.exports = { getMonitoringInsight };
