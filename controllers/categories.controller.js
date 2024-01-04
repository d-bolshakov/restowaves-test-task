const categoriesService = require("../services/categories.service.js");

class CategoriesController {
  async create(req, res, next) {
    try {
      const category = await categoriesService.create(req.body);
      return res.status(200).json(category);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  async getOneById(req, res, next) {
    try {
      const category = await categoriesService.getOneById(req.params.id);
      return res.status(200).json(category);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  async getMany(req, res, next) {
    try {
      const categories = await categoriesService.getMany();
      return res.status(200).json(categories);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const category = await categoriesService.update(req.params.id, req.body);
      return res.status(200).json(category);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const category = await categoriesService.delete(req.params.id);
      return res.status(200).json(category);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
}

module.exports = new CategoriesController();
