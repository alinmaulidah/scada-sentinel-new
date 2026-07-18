const db = require("../config/db");

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Ambil total data riil dari tabel sensor_logs
    const [totalLogs] = await db.execute("SELECT COUNT(*) AS count FROM sensor_logs");
    const total = totalLogs[0].count || 0;
    
    // 2. Kirim total ke frontend dengan properti totalRecords
    res.json({
      totalRecords: total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.recalculateDbscan = async (req, res) => {
    res.status(501).json({ message: "Rescan DBSCAN belum diimplementasikan. Jalankan analisis dari halaman Eksekusi Algoritma." });
};
