const db = require("../config/db");
const { mapAlgorithmResult } = require("../utils/algorithmResult");

// ======================================================
// GET ALL RESULTS (FOR DASHBOARD)
// ======================================================
exports.getAllResults = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM algorithm_results ORDER BY created_at DESC`
    );

    const formatted = rows.map((item) => mapAlgorithmResult(item));

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
