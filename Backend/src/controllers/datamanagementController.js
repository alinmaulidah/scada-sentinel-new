const db = require("../config/db");

// ================= HELPER: FIX TIMEZONE & FORMAT =================
const parseTimestamp = (val) => {
  if (!val) return null;
  try {
    if (typeof val === "string") {
      // Input: "01/01/2024 0:00:00" -> Output: "2024-01-01 00:00:00"
      const [datePart, timePart] = val.split(" ");
      const [day, month, year] = datePart.split("/");
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${timePart || "00:00:00"}`;
    }
    if (typeof val === "number") {
      // Handle format angka Excel
      const date = new Date((val - 25569) * 86400 * 1000);
      return date.toISOString().slice(0, 19).replace("T", " ");
    }
    return val;
  } catch (e) { return val; }
};

const toNum = (v) => {
  if (v === "" || v === null || v === undefined) return 0;
  const cleaned = String(v).replace(",", ".");
  return isNaN(Number(cleaned)) ? 0 : Number(cleaned);
};

// ================= GET DATA (SORT BY ROW INDEX) =================
const getScadaData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;
    const searchQuery = `%${search}%`;

    const [count] = await db.execute(
      "SELECT COUNT(*) AS total FROM sensor_logs WHERE CAST(segment_id AS CHAR) LIKE ? OR event_type LIKE ?",
      [searchQuery, searchQuery]
    );

    // ORDER BY row_index ASC memastikan urutan sama dengan baris di Excel
    const [results] = await db.execute(
  `SELECT 
    id,
    DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') AS timestamp, -- Memaksa format string
    segment_id,
    pressure,
    flow_rate,
    temperature,
    valve_status,
    pump_state,
    pump_speed,
    compressor_state,
    energy_consumption,
    alarm_triggered,
    event_type,
    target,
    row_index
   FROM sensor_logs 
   WHERE CAST(segment_id AS CHAR) LIKE ? OR event_type LIKE ? 
   ORDER BY row_index ASC 
   LIMIT ? OFFSET ?`,
  [searchQuery, searchQuery, limit, offset]
);

    res.json({
      success: true,
      results,
      totalPages: Math.ceil(count[0].total / limit),
      totalRecords: count[0].total,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= IMPORT DATA (13 VARIABLES) =================
const importScadaData = async (req, res) => {
  try {
    const rawData = req.body.data;
    const values = rawData.map((item, index) => [
      parseTimestamp(item.timestamp || item.Timestamp),
      toNum(item.segment_id || item.segment_ID),
      toNum(item.pressure || item.Pressure),
      toNum(item.flow_rate || item.flow_rate),
      toNum(item.temperature || item.Temperature),
      toNum(item.valve_status || item.valve_status),
      toNum(item.pump_state || item.pump_state),
      toNum(item.pump_speed || item.pump_speed),
      toNum(item.compressor_state || item.compressor_state),
      toNum(item.energy_consumption || item.energy_consumption),
      item.alarm_triggered == 1 ? 1 : 0,
      (item.event_type || "normal").toLowerCase(),
      item.target == 1 ? 1 : 0,
      index + 1 // Simpan nomor baris asli Excel
    ]);

    await db.query(
      `INSERT INTO sensor_logs (timestamp, segment_id, pressure, flow_rate, temperature, valve_status, pump_state, pump_speed, compressor_state, energy_consumption, alarm_triggered, event_type, target, row_index) VALUES ?`,
      [values]
    );

    res.json({ success: true, message: "Import Berhasil" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const clearSensorLogs = async (req, res) => {
  try {
    await db.execute("TRUNCATE TABLE sensor_logs");
    res.json({ success: true, message: "Database Cleaned" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getScadaData, importScadaData, clearSensorLogs };