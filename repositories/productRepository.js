const { query } = require('../config/db');

class ProductRepository {
  async findAll({ search, categoryId, isActive, lowStock } = {}) {
    let sql = `
      SELECT p.*,
             c.name AS category_name,
             c.color AS category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR p.barcode ILIKE $${params.length})`;
    }

    if (categoryId) {
      params.push(categoryId);
      sql += ` AND p.category_id = $${params.length}`;
    }

    if (isActive !== undefined && isActive !== '') {
      params.push(isActive === 'true' || isActive === true);
      sql += ` AND p.is_active = $${params.length}`;
    }

    if (lowStock === 'true' || lowStock === true) {
      sql += ` AND p.stock_quantity <= 10`;
    }

    sql += ` ORDER BY p.id DESC`;

    const result = await query(sql, params);
    return result.rows;
  }

  async findById(id) {
    const sql = `
      SELECT p.*,
             c.name AS category_name,
             c.color AS category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  async findBySku(sku) {
    const sql = 'SELECT * FROM products WHERE LOWER(sku) = LOWER($1)';
    const result = await query(sql, [sku.trim()]);
    return result.rows[0] || null;
  }

  async findBySkuExcludingId(sku, id) {
    const sql = 'SELECT * FROM products WHERE LOWER(sku) = LOWER($1) AND id != $2';
    const result = await query(sql, [sku.trim(), id]);
    return result.rows[0] || null;
  }

  async getLastProductNumber() {
    const sql = "SELECT id FROM products ORDER BY id DESC LIMIT 1";
    const result = await query(sql);
    return result.rows.length > 0 ? result.rows[0].id : 0;
  }

  async create(data) {
    const {
      name,
      sku,
      category_id,
      description,
      price,
      cost_price,
      tax_rate,
      stock_quantity,
      unit,
      barcode,
      is_active,
    } = data;

    const sql = `
      INSERT INTO products (
        name, sku, category_id, description, price, cost_price, tax_rate, stock_quantity, unit, barcode, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      name.trim(),
      sku.trim(),
      category_id || null,
      description || '',
      parseFloat(price) || 0,
      cost_price !== undefined && cost_price !== '' ? parseFloat(cost_price) : 0,
      tax_rate !== undefined && tax_rate !== '' ? parseFloat(tax_rate) : 0,
      stock_quantity !== undefined && stock_quantity !== '' ? parseInt(stock_quantity, 10) : 0,
      unit || 'pcs',
      barcode || '',
      is_active !== undefined ? Boolean(is_active) : true,
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  async update(id, data) {
    const {
      name,
      sku,
      category_id,
      description,
      price,
      cost_price,
      tax_rate,
      stock_quantity,
      unit,
      barcode,
      is_active,
    } = data;

    const sql = `
      UPDATE products
      SET name = $1, sku = $2, category_id = $3, description = $4, price = $5,
          cost_price = $6, tax_rate = $7, stock_quantity = $8, unit = $9, barcode = $10,
          is_active = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;

    const values = [
      name.trim(),
      sku.trim(),
      category_id || null,
      description || '',
      parseFloat(price) || 0,
      cost_price !== undefined && cost_price !== '' ? parseFloat(cost_price) : 0,
      tax_rate !== undefined && tax_rate !== '' ? parseFloat(tax_rate) : 0,
      stock_quantity !== undefined && stock_quantity !== '' ? parseInt(stock_quantity, 10) : 0,
      unit || 'pcs',
      barcode || '',
      is_active !== undefined ? Boolean(is_active) : true,
      id,
    ];

    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  async delete(id) {
    const sql = 'DELETE FROM products WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  async adjustStock(productId, delta, client = null) {
    const sql = `
      UPDATE products
      SET stock_quantity = GREATEST(0, stock_quantity + $1)
      WHERE id = $2
      RETURNING stock_quantity
    `;
    if (client) {
      const res = await client.query(sql, [delta, productId]);
      return res.rows[0];
    }
    const res = await query(sql, [delta, productId]);
    return res.rows[0];
  }
}

module.exports = new ProductRepository();
