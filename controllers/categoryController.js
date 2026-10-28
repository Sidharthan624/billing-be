const categoryService = require('../services/categoryService');

class CategoryController {
  async getAll(req, res) {
    try {
      const categories = await categoryService.getAllCategories();
      res.json({ success: true, data: categories });
    } catch (err) {
      console.error('CategoryController.getAll error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(id);
      res.json({ success: true, data: category });
    } catch (err) {
      console.error('CategoryController.getById error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async create(req, res) {
    try {
      const category = await categoryService.createCategory(req.body);
      res.status(201).json({ success: true, message: 'Category created successfully', data: category });
    } catch (err) {
      console.error('CategoryController.create error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const category = await categoryService.updateCategory(id, req.body);
      res.json({ success: true, message: 'Category updated successfully', data: category });
    } catch (err) {
      console.error('CategoryController.update error:', err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const force = req.query.force === 'true';
      const deleted = await categoryService.deleteCategory(id, force);
      res.json({ success: true, message: 'Category deleted successfully', data: deleted });
    } catch (err) {
      console.error('CategoryController.delete error:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        error: err.message,
        productCount: err.productCount,
      });
    }
  }
}

module.exports = new CategoryController();
