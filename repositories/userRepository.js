const { query } = require('../config/db');

class UserRepository {
  async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)';
    const res = await query(sql, [email.trim()]);
    return res.rows[0] || null;
  }

  async findById(id) {
    const sql = 'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1';
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  }

  async create({ name, email, password_hash, role = 'admin' }) {
    const sql = `
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, name, email, role, is_active, created_at
    `;
    const res = await query(sql, [name.trim(), email.trim().toLowerCase(), password_hash, role]);
    return res.rows[0];
  }

  async updateLastLogin(id) {
    const sql = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1';
    await query(sql, [id]);
  }
}

module.exports = new UserRepository();
