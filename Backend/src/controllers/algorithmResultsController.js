const db = require("../config/db");
const { mapAlgorithmResult } = require("../utils/algorithmResult");
const { getMonitoringInsight } = require("../utils/monitoringInsight");

const enrichDetails = (details, isNormalFromAlgorithm) => details.map((item) => {
  const insight = getMonitoringInsight({ ...item, is_normal_from_algo: isNormalFromAlgorithm });

  return {
    ...item,
    prediction: insight.prediction,
    severity: insight.severity,
    insight: {
      reason: insight.reason,
      impact: insight.impact,
      solution: insight.solution,
    },
  };
});

// ======================================================
// GET ALL ALGORITHM RESULTS (FOR MONITORING PAGE)
// ======================================================
exports.getAllAlgorithmResults = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM algorithm_results ORDER BY created_at DESC`
    );

    const formatted = rows.map((item) => {
      const result = mapAlgorithmResult(item, true);
      return {
        ...result,
        anomaly_details: enrichDetails(result.anomaly_details, false),
        normal_details: enrichDetails(result.normal_details, true),
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("GET ALGORITHM RESULTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data algorithm_results",
    });
  }
};

// ======================================================
// DELETE ALGORITHM RESULT BY ID
// ======================================================
exports.deleteAlgorithmResult = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID parameter wajib diisi",
      });
    }

    const [result] = await db.query(
      `DELETE FROM algorithm_results WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Data dengan ID ${id} tidak ditemukan`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Data dengan ID ${id} berhasil dihapus`,
    });
  } catch (error) {
    console.error("DELETE ALGORITHM RESULT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal menghapus data algorithm_results",
    });
  }
};
