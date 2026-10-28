const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');

// Map endpoints to controller methods
router.get('/', (req, res) => billController.getAll(req, res));
router.get('/generate-number', (req, res) => billController.generateNumber(req, res));
router.get('/:id', (req, res) => billController.getById(req, res));
router.post('/', (req, res) => billController.create(req, res));
router.put('/:id', (req, res) => billController.update(req, res));
router.delete('/:id', (req, res) => billController.delete(req, res));

module.exports = router;
