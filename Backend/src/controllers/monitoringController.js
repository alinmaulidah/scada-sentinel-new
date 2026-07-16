const db = require("../config/db");
const { getMonitoringInsight } = require("../utils/monitoringInsight");

const parseDetails = (value) => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatLog = (item, isNormalFromAlgorithm) => {
  const insight = getMonitoringInsight({ ...item, is_normal_from_algo: isNormalFromAlgorithm });

  return {
    timestamp: item.timestamp,
    segment_id: item.segment_id,
    pressure: item.pressure,
    flow_rate: item.flow_rate,
    temperature: item.temperature,
    pump_speed: item.pump_speed,
    prediction: insight.prediction,
    severity: insight.severity,
    insight: {
      reason: insight.reason,
      impact: insight.impact,
      solution: insight.solution,
    },
  };
};

const getMonitoringData = async (req, res) => {
  try {
    const [runs] = await db.query(`
      SELECT id, algorithm, normalization, cluster, eps, min_samples,
        anomaly, normal, silhouette, davies_bouldin, accuracy,
        precision_score, recall_score, f1_score, status,
        anomaly_details, normal_details, created_at
      FROM algorithm_results
      ORDER BY id DESC
      LIMIT 1
    `);

    if (!runs.length) {
      return res.json({ success: true, message: "Belum ada riwayat eksekusi algoritma.", meta: {}, data: [] });
    }

    const run = runs[0];
    const anomalies = parseDetails(run.anomaly_details);
    const normals = parseDetails(run.normal_details);

    return res.json({
      success: true,
      meta: {
        algorithm: run.algorithm,
        normalization: run.normalization,
        cluster: run.cluster,
        metrics: {
          silhouette: run.silhouette,
          davies_bouldin: run.davies_bouldin,
          accuracy: run.accuracy,
          precision: run.precision_score,
          recall: run.recall_score,
          f1_score: run.f1_score,
        },
        summary: {
          total_anomaly: run.anomaly,
          total_normal: run.normal,
          total_data: Number(run.anomaly) + Number(run.normal),
        },
        executed_at: run.created_at,
      },
      data: [
        ...anomalies.map((item) => formatLog(item, false)),
        ...normals.map((item) => formatLog(item, true)),
      ],
    });
  } catch (error) {
    console.error("GET MONITORING ERROR:", error);
    return res.status(500).json({ success: false, message: "Gagal mengambil data monitoring." });
  }
};

module.exports = { getMonitoringData };
