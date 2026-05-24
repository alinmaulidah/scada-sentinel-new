const express = require('express');
const router = express.Router();

// Panggil dashboardController, BUKAN scadaController
const dashboardController = require('../controllers/dashboardController');

router.get('/dashboard-stats', dashboardController.getDashboardStats);
router.post('/recalculate-dbscan', dashboardController.recalculateDbscan);

module.exports = router;