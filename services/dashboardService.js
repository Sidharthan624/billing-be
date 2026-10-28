const dashboardRepository = require('../repositories/dashboardRepository');

class DashboardService {
  async getDashboardData() {
    return await dashboardRepository.getMetrics();
  }
}

module.exports = new DashboardService();
