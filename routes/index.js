const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const billRoutes = require('./billRoutes');
const settingsRoutes = require('./settingsRoutes');
const dashboardRoutes = require('./dashboardRoutes');

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/bills', billRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Billing Backend API',
    architecture: 'Router -> Controller -> Service -> Repository',
    auth: 'JWT & bcrypt enabled',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
