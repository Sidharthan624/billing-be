const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/login', (req, res) => authController.login(req, res));
router.get('/me', authenticate, (req, res) => authController.getMe(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

module.exports = router;
