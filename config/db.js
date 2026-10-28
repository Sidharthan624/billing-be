require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

async function query(text, params) {
  return await pool.query(text, params);
}

async function getClient() {
  return await pool.connect();
}

async function initDb() {
  try {
    console.log('Initializing database tables and schema...');

    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(30) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(30) DEFAULT '#4f46e5',
        tax_rate NUMERIC(5,2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        cost_price NUMERIC(10,2) DEFAULT 0.00,
        tax_rate NUMERIC(5,2) DEFAULT 0.00,
        stock_quantity INTEGER DEFAULT 0,
        unit VARCHAR(20) DEFAULT 'pcs',
        barcode VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bills (
        id SERIAL PRIMARY KEY,
        bill_number VARCHAR(50) UNIQUE NOT NULL,
        bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE,
        customer_name VARCHAR(150) NOT NULL,
        customer_phone VARCHAR(30),
        customer_email VARCHAR(100),
        customer_address TEXT,
        customer_gstin VARCHAR(50),
        template_type VARCHAR(50) DEFAULT 'modern',
        payment_status VARCHAR(30) DEFAULT 'Paid',
        payment_method VARCHAR(30) DEFAULT 'Cash',
        subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        discount_type VARCHAR(10) DEFAULT 'percentage',
        discount_value NUMERIC(10,2) DEFAULT 0.00,
        discount_amount NUMERIC(10,2) DEFAULT 0.00,
        tax_amount NUMERIC(10,2) DEFAULT 0.00,
        shipping_charges NUMERIC(10,2) DEFAULT 0.00,
        round_off NUMERIC(10,2) DEFAULT 0.00,
        grand_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        notes TEXT,
        terms TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bill_items (
        id SERIAL PRIMARY KEY,
        bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        item_name VARCHAR(200) NOT NULL,
        sku VARCHAR(50),
        quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
        unit VARCHAR(20) DEFAULT 'pcs',
        unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        tax_rate NUMERIC(5,2) DEFAULT 0.00,
        tax_amount NUMERIC(10,2) DEFAULT 0.00,
        discount_rate NUMERIC(5,2) DEFAULT 0.00,
        discount_amount NUMERIC(10,2) DEFAULT 0.00,
        total NUMERIC(10,2) NOT NULL DEFAULT 0.00
      );

      CREATE TABLE IF NOT EXISTS store_settings (
        id SERIAL PRIMARY KEY,
        business_name VARCHAR(150) DEFAULT 'Novabill Enterprises',
        legal_name VARCHAR(150) DEFAULT 'Novabill Solutions Pvt Ltd',
        tagline VARCHAR(200) DEFAULT 'Smart Billing & Inventory Suite',
        logo_url TEXT,
        phone VARCHAR(50) DEFAULT '+91 98765 43210',
        email VARCHAR(100) DEFAULT 'billing@novabill.io',
        website VARCHAR(100) DEFAULT 'www.novabill.io',
        address TEXT DEFAULT '404 Tech Park, Indiranagar, Bengaluru, KA 560038',
        gstin VARCHAR(50) DEFAULT '29AABCN8511K1Z2',
        currency_symbol VARCHAR(10) DEFAULT '₹',
        currency_code VARCHAR(10) DEFAULT 'INR',
        invoice_prefix VARCHAR(10) DEFAULT 'INV',
        default_terms TEXT DEFAULT '1. Goods once sold will not be returned without original invoice. 2. Interest @ 18% p.a. applicable for delayed payments after due date. 3. Subject to local jurisdiction.',
        default_notes TEXT DEFAULT 'Thank you for your business! For any billing queries, write to billing@novabill.io',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default Admin User if not exists
    const adminCheck = await query('SELECT id FROM users WHERE email = $1', ['admin@novabill.io']);
    if (adminCheck.rows.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('admin123', salt);
      await query(
        `INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        ['System Administrator', 'admin@novabill.io', hash, 'admin', true]
      );
      console.log('✅ Default admin user seeded: admin@novabill.io / admin123');
    }

    // Ensure store_settings row exists
    const settingsCheck = await query('SELECT id FROM store_settings LIMIT 1');
    if (settingsCheck.rows.length === 0) {
      await query(`
        INSERT INTO store_settings (
          business_name, legal_name, tagline, phone, email, website, address, gstin, currency_symbol, currency_code, invoice_prefix
        ) VALUES (
          'Novabill Enterprises', 'Novabill Solutions Pvt Ltd', 'Smart Billing & Inventory Suite',
          '+91 98765 43210', 'billing@novabill.io', 'www.novabill.io',
          '404 Tech Park, Indiranagar, Bengaluru, KA 560038', '29AABCN8511K1Z2',
          '₹', 'INR', 'INV'
        );
      `);
      console.log('Default store settings initialized.');
    }

    // Seed default categories if empty
    const catCheck = await query('SELECT count(*) FROM categories');
    if (parseInt(catCheck.rows[0].count) === 0) {
      await query(`
        INSERT INTO categories (name, description, color, tax_rate) VALUES
        ('Electronics & Gadgets', 'Smart devices, accessories, cables & audio gear', '#6366f1', 18.00),
        ('Groceries & Provisions', 'Everyday staples, packed foods & essentials', '#10b981', 5.00),
        ('Apparel & Fashion', 'Men, women and kids casual & formal wear', '#ec4899', 12.00),
        ('Office & Stationery', 'Desks, notebooks, writing instruments & paper', '#f59e0b', 18.00),
        ('Personal Care & Health', 'Wellness, personal hygiene & toiletries', '#06b6d4', 18.00);
      `);
      console.log('Default categories seeded.');
    }

    // Seed default products if empty
    const prodCheck = await query('SELECT count(*) FROM products');
    if (parseInt(prodCheck.rows[0].count) === 0) {
      const elecCat = await query("SELECT id FROM categories WHERE name = 'Electronics & Gadgets'");
      const grocCat = await query("SELECT id FROM categories WHERE name = 'Groceries & Provisions'");
      const appCat = await query("SELECT id FROM categories WHERE name = 'Apparel & Fashion'");
      const offCat = await query("SELECT id FROM categories WHERE name = 'Office & Stationery'");

      const eId = elecCat.rows[0]?.id || null;
      const gId = grocCat.rows[0]?.id || null;
      const aId = appCat.rows[0]?.id || null;
      const oId = offCat.rows[0]?.id || null;

      await query(`
        INSERT INTO products (name, sku, category_id, description, price, cost_price, tax_rate, stock_quantity, unit, barcode) VALUES
        ('Wireless ANC Headphones', 'PRD-EL-001', ${eId}, 'Over-ear active noise cancelling Bluetooth headphones', 4499.00, 2800.00, 18.00, 45, 'pcs', '890123450001'),
        ('USB-C Fast Charging Cable 2m', 'PRD-EL-002', ${eId}, 'Braided high durability 65W PD cable', 399.00, 150.00, 18.00, 120, 'pcs', '890123450002'),
        ('Ergonomic Wireless Mouse', 'PRD-EL-003', ${eId}, '2.4GHz + Dual BT ergonomic silent click mouse', 1299.00, 750.00, 18.00, 32, 'pcs', '890123450003'),
        ('Organic Basmati Rice 5kg', 'PRD-GR-001', ${gId}, 'Aged long grain premium fragrant basmati rice', 680.00, 520.00, 5.00, 85, 'kg', '890123450004'),
        ('Cold Pressed Olive Oil 1L', 'PRD-GR-002', ${gId}, 'Extra virgin Spanish cold pressed olive oil', 950.00, 720.00, 5.00, 50, 'litre', '890123450005'),
        ('Classic Oxford Cotton Shirt', 'PRD-AP-001', ${aId}, '100% combed cotton tailored slim-fit shirt', 1899.00, 950.00, 12.00, 60, 'pcs', '890123450006'),
        ('Executive Hardbound Notebook A5', 'PRD-OF-001', ${oId}, '192 pages 100 GSM dotted grid journal', 499.00, 220.00, 18.00, 95, 'pcs', '890123450007'),
        ('Metal Retractable Rollerball Pen', 'PRD-OF-002', ${oId}, '0.5mm matte black tungsten carbide tip', 299.00, 110.00, 18.00, 150, 'pcs', '890123450008');
      `);
      console.log('Default products seeded.');
    }

    console.log('Database initialization completed.');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

module.exports = {
  pool,
  query,
  getClient,
  initDb,
};
