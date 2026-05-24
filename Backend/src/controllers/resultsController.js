const db = require("../config/db");

// ======================================================
// GET ALL RESULTS (FOR DASHBOARD)
// ======================================================
exports.getAllResults = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM algorithm_results ORDER BY created_at DESC`
    );

    const formatted = rows.map((item) => ({
      id: item.id,
      algorithm: item.algorithm,
      normalization: item.normalization,
      anomaly: Number(item.anomaly) || 0,
      normal: Number(item.normal) || 0,

      // IMPORTANT FIX FLOAT
      silhouette: Number(item.silhouette) || 0,
      accuracy: Number(item.accuracy) || 0,

      status: item.status || "Done",

      // JSON parse (biar bisa dipakai frontend)
      anomaly_details: item.anomaly_details
        ? JSON.parse(item.anomaly_details)
        : [],

      normal_details: item.normal_details
        ? JSON.parse(item.normal_details)
        : [],
    }));

    return res.json(formatted);

  } catch (err) {
    console.error("GET RESULTS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data dashboard",
    });
  }
};
exports.resetResults = async (req, res) => {
  try {
    await db.query("DELETE FROM algorithm_results");

    return res.status(200).json({
      success: true,
      message: "All results deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset results",
    });
  }
};