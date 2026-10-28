const billService = require('../services/billService');

class BillController {
  async getAll(req, res) {
    try {
      const filters = {
        search: req.query.search,
        paymentStatus: req.query.paymentStatus,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        limit: req.query.limit,
        offset: req.query.offset,
      };
      const bills = await billService.getAllBills(filters);
      res.json({ success: true, data: bills });
    } catch (err) {
      console.error('BillController.getAll error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const bill = await billService.getBillById(id);
      res.json({ success: true, data: bill });
    } catch (err) {
      console.error('BillController.getById error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async generateNumber(req, res) {
    try {
      const number = await billService.generateBillNumber();
      res.json({ success: true, billNumber: number });
    } catch (err) {
      console.error('BillController.generateNumber error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async create(req, res) {
    try {
      const bill = await billService.createBill(req.body);
      res.status(201).json({ success: true, message: 'Invoice generated successfully', data: bill });
    } catch (err) {
      console.error('BillController.create error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const bill = await billService.updateBill(id, req.body);
      res.json({ success: true, message: 'Invoice updated successfully', data: bill });
    } catch (err) {
      console.error('BillController.update error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await billService.deleteBill(id);
      res.json({ success: true, message: 'Invoice deleted successfully', data: deleted });
    } catch (err) {
      console.error('BillController.delete error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new BillController();
