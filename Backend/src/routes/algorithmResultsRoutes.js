const express = require("express");
const router = express.Router();

const {
  getAllAlgorithmResults,
  deleteAlgorithmResult,
} = require("../controllers/algorithmResultsController");

// GET  /api/algorithm_results     -> Ambil semua data
// DELETE /api/algorithm_results/:id -> Hapus data berdasarkan ID
router.get("/", getAllAlgorithmResults);
router.delete("/:id", deleteAlgorithmResult);

module.exports = router;
