const productService = require('../services/productService');

class ProductController {
  async getAll(req, res) {
    try {
      const filters = {
        search: req.query.search,
        categoryId: req.query.categoryId,
        isActive: req.query.isActive,
        lowStock: req.query.lowStock,
      };
      const products = await productService.getAllProducts(filters);
      res.json({ success: true, data: products });
    } catch (err) {
      console.error('ProductController.getAll error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      res.json({ success: true, data: product });
    } catch (err) {
      console.error('ProductController.getById error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async create(req, res) {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json({ success: true, message: 'Product created successfully', data: product });
    } catch (err) {
      console.error('ProductController.create error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.updateProduct(id, req.body);
      res.json({ success: true, message: 'Product updated successfully', data: product });
    } catch (err) {
      console.error('ProductController.update error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await productService.deleteProduct(id);
      res.json({ success: true, message: 'Product deleted successfully', data: deleted });
    } catch (err) {
      console.error('ProductController.delete error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async adjustStock(req, res) {
    try {
      const { id } = req.params;
      const { delta } = req.body;
      const updated = await productService.adjustStock(id, parseInt(delta, 10) || 0);
      res.json({ success: true, message: 'Stock adjusted successfully', data: updated });
    } catch (err) {
      console.error('ProductController.adjustStock error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new ProductController();
