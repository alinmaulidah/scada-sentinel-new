const db = require("../config/db");

// ================= HELPER: FIX TIMEZONE & FORMAT =================
const parseTimestamp = (val) => {
  if (!val) return null;
  try {
    if (typeof val === "string") {
      const value = val.trim();
      const localMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?))?$/);
      if (localMatch) {
        const [, day, month, year, time = "00:00:00"] = localMatch;
        const normalizedYear = year.length === 2 ? `20${year}` : year;
        return `${normalizedYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${time.padEnd(8, ":00")}`;
      }
      const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?$/);
      if (isoMatch) return `${isoMatch[1]} ${(isoMatch[2] || "00:00:00").padEnd(8, ":00")}`;
      return null;
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
  if (v === "" || v === null || v === undefined) return null;
  const cleaned = String(v).replace(",", ".");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
};

const toBinary = (value) => ([0, 1].includes(Number(value)) ? Number(value) : null);
const toIntegerIn = (value, allowed) => (allowed.includes(Number(value)) ? Number(value) : null);

const SENSOR_RANGES = {
  segment_id: [1, 100000],
  pressure: [0, 200],
  flow_rate: [0, 100],
  temperature: [-50, 150],
  pump_speed: [0, 5000],
  energy_consumption: [0, 1000],
};

const inRange = (value, [min, max]) => value !== null && value >= min && value <= max;
const field = (item, ...names) => names.map((name) => item[name]).find((value) => value !== undefined && value !== null && value !== "");

// ================= GET DATA (SORT BY ROW INDEX) =================
const getScadaData = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
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
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return res.status(400).json({ success: false, message: "Data impor harus berupa array yang tidak kosong." });
    }

    const values = rawData.map((item, index) => [
      parseTimestamp(field(item, "timestamp", "Timestamp")),
      toNum(field(item, "segment_id", "segment_ID", "Segment ID")),
      toNum(field(item, "pressure", "Pressure")),
      toNum(field(item, "flow_rate", "Flow Rate")),
      toNum(field(item, "temperature", "Temperature")),
      toIntegerIn(field(item, "valve_status", "Valve Status"), [0, 1, 2]),
      toBinary(field(item, "pump_state", "Pump State")),
      toNum(field(item, "pump_speed", "Pump Speed")),
      toBinary(field(item, "compressor_state", "Compressor State")),
      toNum(field(item, "energy_consumption", "Energy Consumption")),
      toBinary(field(item, "alarm_triggered", "Alarm Triggered")),
      String(field(item, "event_type", "Event Type") || "").trim().toLowerCase(),
      toBinary(field(item, "target", "Target")),
      index + 1
    ]);

    const invalidRowIndex = values.findIndex((row) => {
      const [timestamp, segmentId, pressure, flowRate, temperature, valveStatus, pumpState, pumpSpeed, compressorState, energy, alarm, eventType, target] = row;
      return !timestamp ||
        !inRange(segmentId, SENSOR_RANGES.segment_id) ||
        !inRange(pressure, SENSOR_RANGES.pressure) ||
        !inRange(flowRate, SENSOR_RANGES.flow_rate) ||
        !inRange(temperature, SENSOR_RANGES.temperature) ||
        valveStatus === null || pumpState === null ||
        !inRange(pumpSpeed, SENSOR_RANGES.pump_speed) ||
        compressorState === null ||
        !inRange(energy, SENSOR_RANGES.energy_consumption) ||
        alarm === null || !eventType || target === null;
    });
    if (invalidRowIndex !== -1) {
      return res.status(400).json({
        success: false,
        message: `Baris ${invalidRowIndex + 2} tidak valid. Pastikan timestamp, status biner, dan rentang sensor sesuai dataset (flow rate 0-100, suhu -50-150, pressure 0-200, pump speed 0-5000, energi 0-1000).`,
      });
    }

    const [existing] = await db.execute("SELECT COUNT(*) AS total FROM sensor_logs");
    if (existing[0].total > 0) {
      return res.status(409).json({
        success: false,
        message: "Dataset aktif sudah ada. Kosongkan data terlebih dahulu agar data tidak tercampur atau terduplikasi dengan hasil penelitian sebelumnya.",
      });
    }

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
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    // Hasil analisis tidak menyimpan salinan/versi dataset sumber. Karena itu,
    // hasil lama wajib dihapus ketika data sumber diganti agar tidak menyesatkan.
    await connection.execute("DELETE FROM algorithm_results");
    await connection.execute("DELETE FROM sensor_logs");
    await connection.commit();
    res.json({
      success: true,
      message: "Dataset aktif dan seluruh riwayat hasil analisisnya telah dikosongkan.",
    });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { getScadaData, importScadaData, clearSensorLogs };
