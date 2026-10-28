const { query } = require('../config/db');

class DashboardRepository {
  async getMetrics() {
    const revenueSql = `
      SELECT
        COALESCE(SUM(grand_total), 0)::numeric(12,2) AS total_revenue,
        COUNT(id)::int AS total_bills,
        COALESCE(SUM(CASE WHEN payment_status = 'Paid' THEN grand_total ELSE 0 END), 0)::numeric(12,2) AS paid_revenue,
        COALESCE(SUM(CASE WHEN payment_status != 'Paid' THEN grand_total ELSE 0 END), 0)::numeric(12,2) AS pending_revenue
      FROM bills
    `;

    const productStatsSql = `
      SELECT
        COUNT(id)::int AS total_products,
        COALESCE(SUM(CASE WHEN stock_quantity <= 10 THEN 1 ELSE 0 END), 0)::int AS low_stock_count,
        COALESCE(SUM(stock_quantity), 0)::int AS total_stock_items
      FROM products
      WHERE is_active = true
    `;

    const catStatsSql = `
      SELECT COUNT(id)::int AS total_categories FROM categories WHERE is_active = true
    `;

    const recentBillsSql = `
      SELECT id, bill_number, bill_date, customer_name, payment_status, payment_method, grand_total
      FROM bills
      ORDER BY id DESC
      LIMIT 6
    `;

    const lowStockSql = `
      SELECT id, name, sku, stock_quantity, unit, price
      FROM products
      WHERE stock_quantity <= 10 AND is_active = true
      ORDER BY stock_quantity ASC
      LIMIT 5
    `;

    const [revRes, prodRes, catRes, billsRes, lowStockRes] = await Promise.all([
      query(revenueSql),
      query(productStatsSql),
      query(catStatsSql),
      query(recentBillsSql),
      query(lowStockSql),
    ]);

    return {
      revenue: revRes.rows[0],
      products: prodRes.rows[0],
      categories: catRes.rows[0],
      recentBills: billsRes.rows,
      lowStockProducts: lowStockRes.rows,
    };
  }
}

module.exports = new DashboardRepository();
