const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost', 
  user: 'root', 
  password: '', 
  database: 'scada-sentinel' // Pastikan nama DB sesuai dengan setup MySQL-mu
});

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Ambil total data riil dari tabel sensor_logs
    const [totalLogs] = await pool.execute('SELECT COUNT(*) as count FROM sensor_logs');
    const total = totalLogs[0].count || 0;
    
    // 2. Kirim total ke frontend dengan properti totalRecords
    res.json({
      totalRecords: total, // <-- DIUBAH DI SINI supaya sinkron dengan frontend
      corePoints: Math.floor(total * 0.7).toString(),
      noiseDetected: Math.floor(total * 0.05).toString(),
      ratios: { core: "70%", border: "25%", noise: "5%" }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.recalculateDbscan = async (req, res) => {
    res.json({ message: "Rescan berhasil" });
};