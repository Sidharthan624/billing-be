const authService = require('../services/authService');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({
        success: true,
        message: 'Login successful',
        token: result.token,
        user: result.user,
      });
    } catch (err) {
      console.error('AuthController.login error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async getMe(req, res) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.json({
        success: true,
        user,
      });
    } catch (err) {
      console.error('AuthController.getMe error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async logout(req, res) {
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}

module.exports = new AuthController();
