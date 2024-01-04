const modelsService = require("../services/models.service.js");

class ModelsController {
  async getOneById(req, res, next) {
    try {
      const model = await modelsService.getOneById(req.params.id);
      return res.status(200).json(model);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  async getMany(req, res, next) {
    try {
      const models = await modelsService.getMany({
        brandId: req.query.brandId,
      });
      return res.status(200).json(models);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const model = await modelsService.update(req.params.id, req.body);
      return res.status(200).json(model);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const model = await modelsService.delete(req.params.id);
      return res.status(200).json(model);
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
}

module.exports = new ModelsController();
