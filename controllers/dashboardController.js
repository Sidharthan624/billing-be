const dashboardService = require('../services/dashboardService');

class DashboardController {
  async getStats(req, res) {
    try {
      const stats = await dashboardService.getDashboardData();
      res.json({ success: true, data: stats });
    } catch (err) {
      console.error('DashboardController.getStats error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new DashboardController();
