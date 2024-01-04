const productsService = require("../services/products.service.js");

class ProductsController {
  async getOneById(req, res, next) {
    try {
      const product = await productsService.getOneById(req.params.id);
      return res.status(200).json(product);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  async getMany(req, res, next) {
    try {
      const products = await productsService.getMany({
        size: req.query.size,
        modelId: req.query.model,
        categoryId: req.query.categoryId,
        brandId: req.query.brandId,
      });
      return res.status(200).json(products);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const product = await productsService.update(req.params.id, req.body);
      return res.status(200).json(product);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const product = await productsService.delete(req.params.id);
      return res.status(200).json(product);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
}

module.exports = new ProductsController();
