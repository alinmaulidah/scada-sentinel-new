const express = require("express");

const router = express.Router();

const {
  getScadaData,
  importScadaData,
  clearSensorLogs,
} = require("../controllers/datamanagementController");


// GET DATA
router.get("/scada-data", getScadaData);

// IMPORT CSV
router.post("/import-scada", importScadaData);

// DELETE ALL
router.delete("/clear-sensor-logs", clearSensorLogs);

module.exports = router;