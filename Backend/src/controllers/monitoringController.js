const db = require("../config/db");

// ====================================================================
// FORMATTER INSIGHT (Fungsi Jaring Pengaman / Fallback Aturan Fisis)
// ====================================================================
const generateInsightFromData = (item) => {
  const pressure = Number(item.pressure || 0);
  const flow = Number(item.flow_rate || 0);
  const temp = Number(item.temperature || 0);
  const speed = Number(item.pump_speed || 0);
  // Hapus default "normal" di sini agar tidak mengacaukan fallback
  const type = String(item.type || "").toLowerCase(); 
  const isNormalFromAlgo = item.is_normal_from_algo; // Ambil flag dari controller

  // ====================================================================
  // 1. KUNCI UTAMA: Pengecekan Normal Paling Atas
  // ====================================================================
  // Jika data murni berasal dari array normal algoritma, jangan ditimpa!
  if (isNormalFromAlgo || type === "normal") {
    return {
      prediction: "Normal",
      severity: "Safe",
      reason: "Seluruh parameter sensor berada pada rentang operasional safe-zone standar Pertamina.",
      impact: "Sistem distribusi pipa berjalan stabil tanpa indikasi fluktuasi anomali.",
      solution: "Lanjutkan monitoring berkala, pengisian logbook harian, dan preventive maintenance sesuai jadwal."
    };
  }

  // ====================================================================
  // PENGECEKAN KONDISI KRITIS (Hanya dieksekusi jika data terdeteksi Anomali)
  // ====================================================================

  // 2. Kasus LEAK (Kebocoran)
  if (type === "leak" || (pressure < 2.5 && flow > 8.0)) {
    return {
      prediction: "Leak",
      severity: "High",
      reason: `Tekanan drop kritis (${pressure.toFixed(2)} Bar) dibarengi penurunan laju aliran. Menunjukkan hilangnya back-pressure fluida akibat kebocoran dinding pipa.`,
      impact: "Risiko kehilangan volume komoditas minyak/gas, pencemaran lingkungan sekitar, dan kegagalan pasokan ke sistem hilir.",
      solution: "Segera lokalisir segmen pipa dengan mengisolasi block valve terdekat, turunkan kecepatan pompa utama, dan kerahkan tim mekanis ke lapangan."
    };
  }

  // 3. Kasus SURGE (Tekanan Kejut)
  if (type === "surge" || (pressure > 5.5 && speed > 1600)) {
    return {
      prediction: "Surge",
      severity: "High",
      reason: `Lonjakan tekanan masif (${pressure.toFixed(2)} Bar) dipicu oleh pump speed berlebih atau efek Water Hammer akibat penutupan katup searah secara mendadak.`,
      impact: "Tekanan dinamis berisiko melampaui batas MAOP (Maximum Allowable Operating Pressure) yang memicu deformasi plastis atau pipa pecah.",
      solution: "Lakukan ramp-down otomatis pada RPM pompa penggerak, buka bypass valve darurat, dan periksa instrumen surge relief system."
    };
  }

  // 4. Kasus BLOCKAGE (Penyumbatan)
  if (type === "blockage" || (pressure > 4.5 && flow < 3.0)) {
    return {
      prediction: "Blockage",
      severity: "High",
      reason: `Kenaikan tekanan hulu mencapai (${pressure.toFixed(2)} Bar) namun dibarengi penurunan laju aliran secara ekstrem (${flow.toFixed(1)} m³/h).`,
      impact: "Terjadi hambatan mekanis total di dalam pipa akibat akumulasi endapan (sludge/waxing) atau malfungsi katup kontrol yang menyempit.",
      solution: "Jadwalkan pembersihan pipa internal (Pigging Operation) segera dan lakukan inspeksi visual serta troubleshooting mekanis pada control valve."
    };
  }

  // 5. Kasus DEGRADATION (Penurunan Kinerja Pompa)
  if (type === "degradation" || temp > 65.0 || (speed > 1500 && flow < 6.0)) {
    return {
      prediction: "Degradation",
      severity: "Medium",
      reason: `Suhu operasional fluida melampaui batas normal (${temp.toFixed(1)}°C) atau pompa bekerja keras (${speed} RPM) namun yield aliran rendah (${flow.toFixed(1)} m³/h).`,
      impact: "Penurunan efisiensi termal/mekanis komponen pompa, risiko kerusakan bearing, atau indikasi keausan (wear and tear) pada impeller.",
      solution: "Lakukan pelumasan ulang (re-greasing) pada bearing penggerak, cek unit heat exchanger, dan rencanakan kalibrasi ulang instrumen."
    };
  }

  // Fallback Default jika tidak masuk kategori fisis manapun
  return {
    prediction: "Anomaly",
    severity: "Medium",
    reason: `Deviasi parameter telemetri berada di luar batas kerapatan densitas klaster normal (DBSCAN Noise).`,
    impact: "Ketidakstabilan transisi operasional atau potensi malfungsi pada pembacaan sensor instrumen di lapangan.",
    solution: "Pantau visualisasi tren grafik dalam 1 jam ke depan dan lakukan validasi silang fisik data telemetry SCADA."
  };
};

// ============================================
// GET MONITORING DATA (ENDPOINT REST API)
// ============================================
const getMonitoringData = async (req, res) => {
  try {
    const query = `
      SELECT 
        id, algorithm, normalization, cluster, eps, min_samples,
        anomaly, normal, silhouette, davies_bouldin, accuracy, 
        precision_score, recall_score, f1_score, status,
        anomaly_details, normal_details, created_at
      FROM algorithm_results
      ORDER BY id DESC
      LIMIT 1
    `;

    const [result] = await db.query(query);

    if (!result || result.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Belum ada riwayat eksekusi algoritma.",
        meta: {},
        data: []
      });
    }

    const latestRun = result[0];

    let anomalies = [];
    let normals = [];
    try { anomalies = JSON.parse(latestRun.anomaly_details || "[]"); } catch(e) { anomalies = []; }
    try { normals = JSON.parse(latestRun.normal_details || "[]"); } catch(e) { normals = []; }

    // BUBBUHKAN FLAG: Agar fungsi insight tahu mana data yang asli Normal dari algoritma
    const taggedAnomalies = anomalies.map(item => ({ ...item, is_normal_from_algo: false }));
    const taggedNormals = normals.map(item => ({ ...item, is_normal_from_algo: true }));

    // Gabungkan semua baris detail
    const allLogs = [...taggedAnomalies, ...taggedNormals];

    const formattedData = allLogs.map((item) => {
      const insightFallback = generateInsightFromData(item);

      const rawType = insightFallback.prediction || item.type || "Anomaly";
      const displayType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();

      return {
        timestamp: item.timestamp,
        segment_id: item.segment_id,
        pressure: item.pressure,
        flow_rate: item.flow_rate,
        temperature: item.temperature,
        pump_speed: item.pump_speed,
        prediction: displayType,
        severity: insightFallback.severity || item.severity || "Medium",
        insight: {
          reason: insightFallback.reason,
          impact: insightFallback.impact,
          solution: insightFallback.solution,
        }
      };
    });

    return res.status(200).json({
      success: true,
      meta: {
        algorithm: latestRun.algorithm,
        normalization: latestRun.normalization,
        cluster: latestRun.cluster,
        metrics: {
          silhouette: latestRun.silhouette,
          davies_bouldin: latestRun.davies_bouldin,
          accuracy: latestRun.accuracy,
          precision: latestRun.precision_score,
          recall: latestRun.recall_score,
          f1_score: latestRun.f1_score
        },
        summary: {
          total_anomaly: latestRun.anomaly,
          total_normal: latestRun.normal,
          total_data: latestRun.anomaly + latestRun.normal
        },
        executed_at: latestRun.created_at
      },
      data: formattedData,
    });
  } catch (error) {
    console.error("Server catch block error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error pada Controller Monitoring",
    });
  }
};

module.exports = {
  getMonitoringData,
};