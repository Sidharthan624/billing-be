const { query, getClient } = require('../config/db');

class BillRepository {
  async findAll({ search, paymentStatus, fromDate, toDate, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT b.*,
             COUNT(bi.id)::int AS items_count
      FROM bills b
      LEFT JOIN bill_items bi ON bi.bill_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (b.bill_number ILIKE $${params.length} OR b.customer_name ILIKE $${params.length} OR b.customer_phone ILIKE $${params.length})`;
    }

    if (paymentStatus && paymentStatus !== 'All') {
      params.push(paymentStatus);
      sql += ` AND b.payment_status = $${params.length}`;
    }

    if (fromDate) {
      params.push(fromDate);
      sql += ` AND b.bill_date >= $${params.length}`;
    }

    if (toDate) {
      params.push(toDate);
      sql += ` AND b.bill_date <= $${params.length}`;
    }

    sql += ` GROUP BY b.id ORDER BY b.id DESC`;

    if (limit) {
      params.push(parseInt(limit, 10));
      sql += ` LIMIT $${params.length}`;
    }
    if (offset) {
      params.push(parseInt(offset, 10));
      sql += ` OFFSET $${params.length}`;
    }

    const result = await query(sql, params);
    return result.rows;
  }

  async findById(id) {
    const billSql = 'SELECT * FROM bills WHERE id = $1';
    const billRes = await query(billSql, [id]);
    if (billRes.rows.length === 0) return null;

    const bill = billRes.rows[0];

    const itemsSql = `
      SELECT bi.*, p.barcode, p.category_id, c.name AS category_name
      FROM bill_items bi
      LEFT JOIN products p ON bi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE bi.bill_id = $1
      ORDER BY bi.id ASC
    `;
    const itemsRes = await query(itemsSql, [id]);
    bill.items = itemsRes.rows;

    return bill;
  }

  async findByBillNumber(billNumber) {
    const sql = 'SELECT * FROM bills WHERE bill_number = $1';
    const res = await query(sql, [billNumber]);
    return res.rows[0] || null;
  }

  async getLastBillId() {
    const sql = 'SELECT id FROM bills ORDER BY id DESC LIMIT 1';
    const res = await query(sql);
    return res.rows.length > 0 ? res.rows[0].id : 0;
  }

  async createWithItems(billData, items, deductStock = true) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const billSql = `
        INSERT INTO bills (
          bill_number, bill_date, due_date, customer_name, customer_phone, customer_email,
          customer_address, customer_gstin, template_type, payment_status, payment_method,
          subtotal, discount_type, discount_value, discount_amount, tax_amount, shipping_charges,
          round_off, grand_total, notes, terms
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) RETURNING *
      `;

      const billValues = [
        billData.bill_number,
        billData.bill_date || new Date().toISOString().split('T')[0],
        billData.due_date || null,
        billData.customer_name,
        billData.customer_phone || '',
        billData.customer_email || '',
        billData.customer_address || '',
        billData.customer_gstin || '',
        billData.template_type || 'modern',
        billData.payment_status || 'Paid',
        billData.payment_method || 'Cash',
        billData.subtotal || 0,
        billData.discount_type || 'percentage',
        billData.discount_value || 0,
        billData.discount_amount || 0,
        billData.tax_amount || 0,
        billData.shipping_charges || 0,
        billData.round_off || 0,
        billData.grand_total || 0,
        billData.notes || '',
        billData.terms || '',
      ];

      const billRes = await client.query(billSql, billValues);
      const createdBill = billRes.rows[0];

      const createdItems = [];
      for (const item of items) {
        const itemSql = `
          INSERT INTO bill_items (
            bill_id, product_id, item_name, sku, quantity, unit, unit_price,
            tax_rate, tax_amount, discount_rate, discount_amount, total
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          ) RETURNING *
        `;
        const itemValues = [
          createdBill.id,
          item.product_id || null,
          item.item_name,
          item.sku || '',
          parseFloat(item.quantity) || 1,
          item.unit || 'pcs',
          parseFloat(item.unit_price) || 0,
          parseFloat(item.tax_rate) || 0,
          parseFloat(item.tax_amount) || 0,
          parseFloat(item.discount_rate) || 0,
          parseFloat(item.discount_amount) || 0,
          parseFloat(item.total) || 0,
        ];
        const itemRes = await client.query(itemSql, itemValues);
        createdItems.push(itemRes.rows[0]);

        // Deduct inventory if product_id is present and deductStock is true
        if (deductStock && item.product_id) {
          const qty = parseFloat(item.quantity) || 1;
          await client.query(
            'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2',
            [qty, item.product_id]
          );
        }
      }

      await client.query('COMMIT');
      createdBill.items = createdItems;
      return createdBill;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(id, billData) {
    const sql = `
      UPDATE bills
      SET bill_date = $1, due_date = $2, customer_name = $3, customer_phone = $4,
          customer_email = $5, customer_address = $6, customer_gstin = $7,
          template_type = $8, payment_status = $9, payment_method = $10,
          notes = $11, terms = $12
      WHERE id = $13
      RETURNING *
    `;
    const values = [
      billData.bill_date,
      billData.due_date,
      billData.customer_name,
      billData.customer_phone,
      billData.customer_email,
      billData.customer_address,
      billData.customer_gstin,
      billData.template_type,
      billData.payment_status,
      billData.payment_method,
      billData.notes,
      billData.terms,
      id,
    ];
    const res = await query(sql, values);
    return res.rows[0] || null;
  }

  async delete(id) {
    const sql = 'DELETE FROM bills WHERE id = $1 RETURNING *';
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  }
}

module.exports = new BillRepository();
