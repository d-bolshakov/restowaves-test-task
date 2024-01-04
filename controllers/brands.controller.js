const brandsService = require("../services/brands.service.js");

class BrandsController {
  async create(req, res, next) {
    try {
      const brand = await brandsService.create(req.body);
      return res.status(200).json(brand);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  async getOneById(req, res, next) {
    try {
      const brand = await brandsService.getOneById(req.params.id);
      return res.status(200).json(brand);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  async getMany(req, res, next) {
    try {
      const brands = await brandsService.getMany();
      return res.status(200).json(brands);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const brand = await brandsService.update(req.params.id, req.body);
      return res.status(200).json(brand);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const brand = await brandsService.delete(req.params.id);
      return res.status(200).json(brand);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
}

module.exports = new BrandsController();
