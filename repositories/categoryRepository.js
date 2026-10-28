const { query } = require('../config/db');

class CategoryRepository {
  async findAll() {
    const sql = `
      SELECT c.*, COUNT(p.id)::int AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    const result = await query(sql);
    return result.rows;
  }

  async findById(id) {
    const sql = 'SELECT * FROM categories WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  async findByName(name) {
    const sql = 'SELECT * FROM categories WHERE LOWER(name) = LOWER($1)';
    const result = await query(sql, [name.trim()]);
    return result.rows[0] || null;
  }

  async findByNameExcludingId(name, id) {
    const sql = 'SELECT * FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2';
    const result = await query(sql, [name.trim(), id]);
    return result.rows[0] || null;
  }

  async countProductsByCategoryId(categoryId) {
    const sql = 'SELECT COUNT(*)::int AS count FROM products WHERE category_id = $1';
    const result = await query(sql, [categoryId]);
    return result.rows[0].count;
  }

  async unlinkProducts(categoryId) {
    const sql = 'UPDATE products SET category_id = NULL WHERE category_id = $1';
    await query(sql, [categoryId]);
  }

  async create({ name, description, color, tax_rate, is_active }) {
    const sql = `
      INSERT INTO categories (name, description, color, tax_rate, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      name.trim(),
      description || '',
      color || '#4f46e5',
      tax_rate !== undefined && tax_rate !== '' ? parseFloat(tax_rate) : 0,
      is_active !== undefined ? Boolean(is_active) : true,
    ];
    const result = await query(sql, values);
    return result.rows[0];
  }

  async update(id, { name, description, color, tax_rate, is_active }) {
    const sql = `
      UPDATE categories
      SET name = $1, description = $2, color = $3, tax_rate = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    const values = [
      name.trim(),
      description || '',
      color || '#4f46e5',
      tax_rate !== undefined && tax_rate !== '' ? parseFloat(tax_rate) : 0,
      is_active !== undefined ? Boolean(is_active) : true,
      id,
    ];
    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  async delete(id) {
    const sql = 'DELETE FROM categories WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }
}

module.exports = new CategoryRepository();
