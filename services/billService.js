const billRepository = require('../repositories/billRepository');
const settingsRepository = require('../repositories/settingsRepository');
const productRepository = require('../repositories/productRepository');

class BillService {
  async getAllBills(filters) {
    return await billRepository.findAll(filters);
  }

  async getBillById(id) {
    const bill = await billRepository.findById(id);
    if (!bill) {
      const err = new Error('Bill not found');
      err.statusCode = 404;
      throw err;
    }
    return bill;
  }

  async generateBillNumber() {
    const settings = await settingsRepository.getSettings();
    const prefix = settings?.invoice_prefix || 'INV';
    const year = new Date().getFullYear();
    const lastId = await billRepository.getLastBillId();
    const seq = (lastId + 1).toString().padStart(4, '0');
    let candidate = `${prefix}-${year}-${seq}`;

    // Verify uniqueness
    let existing = await billRepository.findByBillNumber(candidate);
    let counter = 1;
    while (existing) {
      candidate = `${prefix}-${year}-${(lastId + 1 + counter).toString().padStart(4, '0')}`;
      existing = await billRepository.findByBillNumber(candidate);
      counter++;
    }

    return candidate;
  }

  async createBill(data) {
    if (!data.customer_name || !data.customer_name.trim()) {
      const err = new Error('Customer name is required');
      err.statusCode = 400;
      throw err;
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      const err = new Error('At least one bill item is required');
      err.statusCode = 400;
      throw err;
    }

    // Auto-generate bill number if not provided
    let billNumber = data.bill_number ? data.bill_number.trim().toUpperCase() : '';
    if (!billNumber) {
      billNumber = await this.generateBillNumber();
    } else {
      const existing = await billRepository.findByBillNumber(billNumber);
      if (existing) {
        const err = new Error(`Bill number '${billNumber}' already exists`);
        err.statusCode = 409;
        throw err;
      }
    }

    // Calculate item totals and aggregate bill totals
    let subtotal = 0;
    let totalTax = 0;
    const computedItems = [];

    for (const rawItem of data.items) {
      if (!rawItem.item_name || !rawItem.item_name.trim()) {
        const err = new Error('All bill items must have a name');
        err.statusCode = 400;
        throw err;
      }

      const qty = parseFloat(rawItem.quantity) || 1;
      const unitPrice = parseFloat(rawItem.unit_price) || 0;
      const taxRate = parseFloat(rawItem.tax_rate) || 0;
      const discountRate = parseFloat(rawItem.discount_rate) || 0;

      const itemBase = qty * unitPrice;
      const itemDiscount = itemBase * (discountRate / 100);
      const taxableAmount = Math.max(0, itemBase - itemDiscount);
      const itemTax = taxableAmount * (taxRate / 100);
      const lineTotal = taxableAmount + itemTax;

      subtotal += taxableAmount;
      totalTax += itemTax;

      computedItems.push({
        product_id: rawItem.product_id || null,
        item_name: rawItem.item_name.trim(),
        sku: rawItem.sku || '',
        quantity: qty,
        unit: rawItem.unit || 'pcs',
        unit_price: unitPrice,
        tax_rate: taxRate,
        tax_amount: parseFloat(itemTax.toFixed(2)),
        discount_rate: discountRate,
        discount_amount: parseFloat(itemDiscount.toFixed(2)),
        total: parseFloat(lineTotal.toFixed(2)),
      });
    }

    // Overall bill discount
    const discountType = data.discount_type === 'flat' ? 'flat' : 'percentage';
    const discountVal = parseFloat(data.discount_value) || 0;
    let billDiscountAmount = 0;
    if (discountType === 'percentage') {
      billDiscountAmount = subtotal * (discountVal / 100);
    } else {
      billDiscountAmount = Math.min(subtotal, discountVal);
    }

    const shipping = parseFloat(data.shipping_charges) || 0;
    const preRound = (subtotal - billDiscountAmount) + totalTax + shipping;
    const grandTotal = Math.round(preRound * 100) / 100;
    const roundedGrandTotal = data.auto_round !== false ? Math.round(grandTotal) : grandTotal;
    const roundOff = parseFloat((roundedGrandTotal - preRound).toFixed(2));

    const billRecord = {
      bill_number: billNumber,
      bill_date: data.bill_date || new Date().toISOString().split('T')[0],
      due_date: data.due_date || null,
      customer_name: data.customer_name.trim(),
      customer_phone: data.customer_phone || '',
      customer_email: data.customer_email || '',
      customer_address: data.customer_address || '',
      customer_gstin: data.customer_gstin || '',
      template_type: data.template_type || 'modern',
      payment_status: data.payment_status || 'Paid',
      payment_method: data.payment_method || 'Cash',
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount_type: discountType,
      discount_value: discountVal,
      discount_amount: parseFloat(billDiscountAmount.toFixed(2)),
      tax_amount: parseFloat(totalTax.toFixed(2)),
      shipping_charges: parseFloat(shipping.toFixed(2)),
      round_off: roundOff,
      grand_total: roundedGrandTotal,
      notes: data.notes || '',
      terms: data.terms || '',
    };

    const deductStock = data.deduct_stock !== false;
    return await billRepository.createWithItems(billRecord, computedItems, deductStock);
  }

  async updateBill(id, data) {
    const existing = await billRepository.findById(id);
    if (!existing) {
      const err = new Error('Bill not found');
      err.statusCode = 404;
      throw err;
    }

    return await billRepository.update(id, data);
  }

  async deleteBill(id) {
    const existing = await billRepository.findById(id);
    if (!existing) {
      const err = new Error('Bill not found');
      err.statusCode = 404;
      throw err;
    }
    return await billRepository.delete(id);
  }
}

module.exports = new BillService();
