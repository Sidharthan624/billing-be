const productRepository = require('../repositories/productRepository');
const categoryRepository = require('../repositories/categoryRepository');

class ProductService {
  async getAllProducts(filters) {
    return await productRepository.findAll(filters);
  }

  async getProductById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }
    return product;
  }

  async createProduct(data) {
    if (!data.name || !data.name.trim()) {
      const err = new Error('Product name is required');
      err.statusCode = 400;
      throw err;
    }

    if (data.price === undefined || data.price === '' || parseFloat(data.price) < 0) {
      const err = new Error('Valid product price is required');
      err.statusCode = 400;
      throw err;
    }

    // Auto-generate SKU if not provided
    let sku = data.sku ? data.sku.trim().toUpperCase() : '';
    if (!sku) {
      const lastId = await productRepository.getLastProductNumber();
      const nextNum = (lastId + 1).toString().padStart(4, '0');
      sku = `PRD-${nextNum}`;
    }

    const dupSku = await productRepository.findBySku(sku);
    if (dupSku) {
      const err = new Error(`Product with SKU '${sku}' already exists`);
      err.statusCode = 409;
      throw err;
    }

    // If category is provided, check existence
    if (data.category_id) {
      const cat = await categoryRepository.findById(data.category_id);
      if (!cat) {
        data.category_id = null;
      }
    }

    return await productRepository.create({
      ...data,
      sku,
    });
  }

  async updateProduct(id, data) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }

    if (!data.name || !data.name.trim()) {
      const err = new Error('Product name is required');
      err.statusCode = 400;
      throw err;
    }

    if (data.price === undefined || data.price === '' || parseFloat(data.price) < 0) {
      const err = new Error('Valid product price is required');
      err.statusCode = 400;
      throw err;
    }

    const sku = data.sku ? data.sku.trim().toUpperCase() : existing.sku;
    const dupSku = await productRepository.findBySkuExcludingId(sku, id);
    if (dupSku) {
      const err = new Error(`Another product with SKU '${sku}' already exists`);
      err.statusCode = 409;
      throw err;
    }

    return await productRepository.update(id, {
      ...data,
      sku,
    });
  }

  async deleteProduct(id) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }
    return await productRepository.delete(id);
  }

  async adjustStock(id, delta) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }
    return await productRepository.adjustStock(id, delta);
  }
}

module.exports = new ProductService();
