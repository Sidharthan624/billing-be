const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Map endpoints to controller methods
router.get('/', (req, res) => categoryController.getAll(req, res));
router.get('/:id', (req, res) => categoryController.getById(req, res));
router.post('/', (req, res) => categoryController.create(req, res));
router.put('/:id', (req, res) => categoryController.update(req, res));
router.delete('/:id', (req, res) => categoryController.delete(req, res));

module.exports = router;
