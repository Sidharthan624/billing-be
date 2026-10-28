const settingsService = require('../services/settingsService');

class SettingsController {
  async getSettings(req, res) {
    try {
      const settings = await settingsService.getSettings();
      res.json({ success: true, data: settings });
    } catch (err) {
      console.error('SettingsController.getSettings error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async updateSettings(req, res) {
    try {
      const updated = await settingsService.updateSettings(req.body);
      res.json({ success: true, message: 'Settings updated successfully', data: updated });
    } catch (err) {
      console.error('SettingsController.updateSettings error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new SettingsController();
