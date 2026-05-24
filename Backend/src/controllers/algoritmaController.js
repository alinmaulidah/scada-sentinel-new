const { exec } = require("child_process");
const path = require("path");
const db = require("../config/db");

// ======================================================
// PROMISE WRAPPER EXEC (lebih stabil)
// ======================================================
const runPython = (command) => {
  return new Promise((resolve, reject) => {
    exec(
      command,
      { timeout: 60000, maxBuffer: 1024 * 1024 * 10 },
      (error, stdout, stderr) => {
        if (error) return reject(error);
        resolve({ stdout, stderr });
      }
    );
  });
};

// ======================================================
// EXECUTE ALGORITHM (FINAL VERSION)
// ======================================================
exports.executeAlgorithm = async (req, res) => {
  try {
    const {
      algorithm,
      normalization,
      cluster,
      auto_cluster,
    } = req.body;

    // ================= VALIDATION =================
    if (!algorithm || !normalization) {
      return res.status(400).json({
        success: false,
        message: "Algorithm & normalization wajib diisi",
      });
    }

    const scriptPath = path.join(
      __dirname,
      "../scripts/analysis.py"
    );

    const inputData = JSON.stringify({
      algorithm,
      normalization,
      cluster,
      auto_cluster,
    });

    const command = `python "${scriptPath}" "${inputData.replace(/"/g, '\\"')}"`;

    // ================= RUN PYTHON =================
    const { stdout } = await runPython(command);

    const lines = stdout.trim().split("\n").filter(Boolean);
    const lastLine = lines[lines.length - 1];

    const results = JSON.parse(lastLine);

    // ================= SAFE CAST (IMPORTANT) =================
    const safeNumber = (v) =>
      v === null || v === undefined || v === "" ? 0 : Number(v);

    // ================= SAVE TO DATABASE =================
    await db.query(
      `INSERT INTO algorithm_results (
        algorithm,
        normalization,
        cluster,
        eps,
        min_samples,
        anomaly,
        normal,
        silhouette,
        davies_bouldin,
        accuracy,
        precision_score,
        recall_score,
        f1_score,
        status,
        anomaly_details,
        normal_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        results.algorithm,
        results.normalization,
        results.cluster,
        results.eps,
        results.min_samples,
        safeNumber(results.anomaly),
        safeNumber(results.normal),
        safeNumber(results.silhouette),
        safeNumber(results.davies_bouldin),
        safeNumber(results.accuracy),
        safeNumber(results.precision),
        safeNumber(results.recall),
        safeNumber(results.f1_score),
        results.status || "Done",
        JSON.stringify(results.anomaly_details || []),
        JSON.stringify(results.normal_details || []),
      ]
    );

    // ================= RESPONSE =================
    return res.json({
      success: true,
      ...results,
    });

  } catch (err) {
    console.error("ERROR EXECUTE:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};