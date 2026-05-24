const express = require("express");

const router = express.Router();

const {
  getMonitoringData,
} = require("../controllers/monitoringController");

// ======================================
// ROUTES
// ======================================

router.get("/", getMonitoringData);

module.exports = router;