const Model = require("../db/models/Model");
const db = require("../db/database");
const brandsService = require("./brands.service");
const Brand = require("../db/models/Brand");
const { Op } = require("sequelize");

class ModelsService {
  async create(dto) {
    if (await this.existsWithName(dto.name))
      throw new Error(`Brand with name '${dto.name}' already exists`);
    const model = Model.build({ name: dto.name });
    if (dto.brandId) {
      if (!(await brandsService.existsWithId(dto.brandId)))
        throw new Error(`Brand with id ${dto.brandId} does not exist`);
      model.brandId = dto.brandId;
    }
    return model.save();
  }

  async createMany(dto) {
    return Model.bulkCreate(dto);
  }

  async getOneById(id) {
    const model = await Model.findOne({ where: { id } });
    if (!model) throw new Error(`Model with id ${id} does not exist`);
    return model;
  }

  // метод для отримання всіх моделей
  // може приймати дто з фільтром по бренду,
  // може приймати одне значення, або масив
  async getMany(filterDto) {
    const { brandId } = filterDto;
    let options = { include: [] };
    if (brandId)
      options.include.push({
        model: Brand,
        as: "brand",
        where: {
          id: brandId.length > 1 ? { [Op.in]: brandId } : brandId,
        },
      });
    return Model.findAll(options);
  }

  async update(id, dto) {
    const model = await this.getOneById(id);
    if (dto.name) {
      if (await this.existsWithName(dto.name))
        throw new Error(`Model with name '${dto.name}' already exists`);
      model.name = dto.name;
    }
    if (dto.brandId) {
      if (!(await brandsService.existsWithId(dto.brandId)))
        throw new Error(`Brand with id ${dto.brandId} does not exist`);
      model.brandId = dto.brandId;
    }
    return model.save();
  }

  async delete(id) {
    const model = await this.getOneById(id);
    model.destroy();
    return { message: `Model with id ${id} was deleted successfully` };
  }

  async deleteMany(ids) {
    return Model.destroy({ where: { id: ids } });
  }

  async existsWithName(name) {
    const [{ exists }] = await db.query(
      `SELECT EXISTS (SELECT 1 FROM "models" WHERE "name" LIKE :name)`,
      {
        replacements: { name },
        type: db.QueryTypes.SELECT,
      }
    );
    return exists;
  }

  async existsWithId(id) {
    const [{ exists }] = await db.query(
      `SELECT EXISTS (SELECT 1 FROM "models" WHERE "id" = :id)`,
      {
        replacements: { id },
        type: db.QueryTypes.SELECT,
      }
    );
    return exists;
  }
}

module.exports = new ModelsService();
