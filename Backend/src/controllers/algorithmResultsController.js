const db = require("../config/db");

// ======================================================
// GET ALL ALGORITHM RESULTS (FOR MONITORING PAGE)
// ======================================================
exports.getAllAlgorithmResults = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM algorithm_results ORDER BY created_at DESC`
    );

    const formatted = rows.map((item) => ({
      id: item.id,
      algorithm: item.algorithm,
      normalization: item.normalization,
      cluster: item.cluster,
      eps: item.eps,
      min_samples: item.min_samples,
      anomaly: Number(item.anomaly) || 0,
      normal: Number(item.normal) || 0,
      silhouette: Number(item.silhouette) || 0,
      davies_bouldin: Number(item.davies_bouldin) || 0,
      accuracy: Number(item.accuracy) || 0,
      precision_score: Number(item.precision_score) || 0,
      recall_score: Number(item.recall_score) || 0,
      f1_score: Number(item.f1_score) || 0,
      status: item.status || "Done",
      anomaly_details: item.anomaly_details
        ? JSON.parse(item.anomaly_details)
        : [],
      normal_details: item.normal_details
        ? JSON.parse(item.normal_details)
        : [],
      created_at: item.created_at,
    }));

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
