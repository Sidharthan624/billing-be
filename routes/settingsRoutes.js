const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/', (req, res) => settingsController.getSettings(req, res));
router.put('/', (req, res) => settingsController.updateSettings(req, res));

module.exports = router;
