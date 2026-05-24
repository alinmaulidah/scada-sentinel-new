const express = require("express");

const router = express.Router();

const {
  executeAlgorithm,
} = require("../controllers/algoritmaController");

const {
  getAllResults,
  resetResults,
} = require("../controllers/resultsController");

// =====================================================
// ROUTE ANALISIS
// =====================================================

router.post(
  "/run",
  executeAlgorithm
);

router.get("/results", getAllResults);
router.delete("/reset", resetResults);
// =====================================================
// EXPORT
// =====================================================

module.exports = router;