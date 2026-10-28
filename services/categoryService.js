const categoryRepository = require('../repositories/categoryRepository');

class CategoryService {
  async getAllCategories() {
    return await categoryRepository.findAll();
  }

  async getCategoryById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }
    return category;
  }

  async createCategory(data) {
    if (!data.name || !data.name.trim()) {
      const err = new Error('Category name is required');
      err.statusCode = 400;
      throw err;
    }

    const existing = await categoryRepository.findByName(data.name);
    if (existing) {
      const err = new Error('Category with this name already exists');
      err.statusCode = 409;
      throw err;
    }

    return await categoryRepository.create(data);
  }

  async updateCategory(id, data) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }

    if (!data.name || !data.name.trim()) {
      const err = new Error('Category name is required');
      err.statusCode = 400;
      throw err;
    }

    const dup = await categoryRepository.findByNameExcludingId(data.name, id);
    if (dup) {
      const err = new Error('Another category with this name already exists');
      err.statusCode = 409;
      throw err;
    }

    return await categoryRepository.update(id, data);
  }

  async deleteCategory(id, force = false) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }

    const productCount = await categoryRepository.countProductsByCategoryId(id);
    if (productCount > 0 && !force) {
      const err = new Error(`Cannot delete category: ${productCount} product(s) are assigned to it.`);
      err.statusCode = 400;
      err.productCount = productCount;
      throw err;
    }

    if (productCount > 0 && force) {
      await categoryRepository.unlinkProducts(id);
    }

    return await categoryRepository.delete(id);
  }
}

module.exports = new CategoryService();
