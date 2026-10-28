const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', (req, res) => dashboardController.getStats(req, res));

module.exports = router;
