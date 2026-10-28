const settingsRepository = require('../repositories/settingsRepository');

class SettingsService {
  async getSettings() {
    return await settingsRepository.getSettings();
  }

  async updateSettings(data) {
    return await settingsRepository.updateSettings(data);
  }
}

module.exports = new SettingsService();
