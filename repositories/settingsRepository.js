const { query } = require('../config/db');

class SettingsRepository {
  async getSettings() {
    const sql = 'SELECT * FROM store_settings ORDER BY id ASC LIMIT 1';
    const res = await query(sql);
    return res.rows[0] || null;
  }

  async updateSettings(data) {
    const current = await this.getSettings();
    if (!current) {
      const insertSql = `
        INSERT INTO store_settings (
          business_name, legal_name, tagline, logo_url, phone, email, website,
          address, gstin, currency_symbol, currency_code, invoice_prefix, default_terms, default_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      const values = [
        data.business_name || 'Novabill Enterprises',
        data.legal_name || 'Novabill Solutions Pvt Ltd',
        data.tagline || '',
        data.logo_url || '',
        data.phone || '',
        data.email || '',
        data.website || '',
        data.address || '',
        data.gstin || '',
        data.currency_symbol || '₹',
        data.currency_code || 'INR',
        data.invoice_prefix || 'INV',
        data.default_terms || '',
        data.default_notes || '',
      ];
      const insertRes = await query(insertSql, values);
      return insertRes.rows[0];
    }

    const sql = `
      UPDATE store_settings
      SET business_name = $1, legal_name = $2, tagline = $3, logo_url = $4,
          phone = $5, email = $6, website = $7, address = $8, gstin = $9,
          currency_symbol = $10, currency_code = $11, invoice_prefix = $12,
          default_terms = $13, default_notes = $14, updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `;
    const values = [
      data.business_name || current.business_name,
      data.legal_name || current.legal_name,
      data.tagline || current.tagline,
      data.logo_url !== undefined ? data.logo_url : current.logo_url,
      data.phone || current.phone,
      data.email || current.email,
      data.website || current.website,
      data.address || current.address,
      data.gstin || current.gstin,
      data.currency_symbol || current.currency_symbol,
      data.currency_code || current.currency_code,
      data.invoice_prefix || current.invoice_prefix,
      data.default_terms || current.default_terms,
      data.default_notes || current.default_notes,
      current.id,
    ];
    const updateRes = await query(sql, values);
    return updateRes.rows[0];
  }
}

module.exports = new SettingsRepository();
