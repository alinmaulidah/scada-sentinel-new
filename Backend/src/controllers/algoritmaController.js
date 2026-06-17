const { execFile } = require("child_process");
const path = require("path");
const db = require("../config/db"); // Import koneksi MySQL pool/promise kamu

// ======================================================
// PROMISE WRAPPER EXECFILE (Aman dari Alokasi Buffer Macet)
// ======================================================
const runPythonFile = (scriptPath, args) => {
  return new Promise((resolve, reject) => {
    execFile(
      "python", 
      [scriptPath, args],
      { 
        timeout: 0,                 // Node.js dilarang mematikan runtime Python secara paksa
        maxBuffer: 1024 * 1024 * 50 // Buffer 50MB sangat lega menampung array detail log anomali & normal
      },
      (error, stdout, stderr) => {
        if (error) return reject(error);
        resolve({ stdout, stderr });
      }
    );
  });
};

// ======================================================
// MAIN CONTROLLER METHOD EXPORT
// ======================================================
exports.executeAlgorithm = async (req, res) => {
  try {
    const {
      algorithm,
      normalization,
      auto_cluster,
    } = req.body;

    // Validation Check
    if (!algorithm || !normalization) {
      return res.status(400).json({
        success: false,
        message: "Algorithm & normalization wajib diisi",
      });
    }

    const scriptPath = path.join(__dirname, "../scripts/analysis.py");

    const inputData = JSON.stringify({
      algorithm,
      normalization,
      auto_cluster: auto_cluster !== undefined ? auto_cluster : true,
    });

    // Jalankan Skrip Python secara aman lewat argumen array langsung
    const { stdout } = await runPythonFile(scriptPath, inputData);

    const lines = stdout.trim().split("\n").filter(Boolean);
    const lastLine = lines[lines.length - 1];

    let results;
    try {
      results = JSON.parse(lastLine);
    } catch (parseErr) {
      throw new Error(`Gagal parsing JSON output Python. Raw output: ${lastLine}`);
    }

    // Antisipasi jika Python melemparkan pesan error internal database/koneksi
    if (results.error) {
      return res.status(400).json({
        success: false,
        message: "Error di script Python internal",
        details: results.error
      });
    }

    // Utilitas Pengaman Tipe Data Angka
    const safeNumber = (v) =>
      v === null || v === undefined || v === "" || isNaN(v) ? 0 : Number(v);

    // Utilitas Khusus Kolom DB FLOAT/INT yang Nullable (Agar K-Means tidak memaksakan angka 0 ke kolom EPS/Min Samples)
    const safeNumberOrNull = (v) =>
      v === null || v === undefined || v === "" ? null : (isNaN(v) ? 0 : Number(v));

    // Simpan Rekapitulasi Hasil ke Tabel database MySQL
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
        results.algorithm || "-",
        results.normalization || "-",
        results.cluster || "-",                 // Menyimpan nilai auto cluster dinamis hasil kalkulasi Python (2 s/d 5)
        safeNumberOrNull(results.eps),         // Tetap NULL jika jalurnya K-Means
        safeNumberOrNull(results.min_samples), // Tetap NULL jika jalurnya K-Means
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

    // Kembalikan objek data utuh ke dashboard sistem klien React Frontend
    return res.json({
      success: true,
      ...results,
    });

  } catch (err) {
    console.error("ERROR EXECUTE:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error saat menjalankan algoritma",
      details: err.message
    });
  }
};