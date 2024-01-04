const Brand = require("../db/models/Brand");
const db = require("../db/database");

class BrandsService {
  async create(dto) {
    if (await this.existsWithName(dto.name))
      throw new Error(`Brand with name '${dto.name}' already exists`);
    return Brand.create({ name: dto.name });
  }

  async getOneById(id) {
    const brand = await Brand.findOne({ where: { id } });
    if (!brand) throw new Error(`Brand with id ${id} does not exist`);
    return brand;
  }

  async getMany() {
    return Brand.findAll();
  }

  async update(id, dto) {
    const brand = await this.getOneById(id);
    if (await this.existsWithName(dto.name))
      throw new Error(`Brand with name '${dto.name}' already exists`);
    brand.name = dto.name;
    return brand.save();
  }

  async delete(id) {
    const brand = await this.getOneById(id);
    brand.destroy();
    return { message: `Brand with id ${id} was deleted successfully` };
  }

  async existsWithName(name) {
    const [{ exists }] = await db.query(
      `SELECT EXISTS (SELECT 1 FROM "brands" WHERE "name" LIKE :name)`,
      {
        replacements: { name },
        type: db.QueryTypes.SELECT,
      }
    );
    return exists;
  }

  async existsWithId(id) {
    const [{ exists }] = await db.query(
      `SELECT EXISTS (SELECT 1 FROM "brands" WHERE "id" = :id)`,
      {
        replacements: { id },
        type: db.QueryTypes.SELECT,
      }
    );
    return exists;
  }
}

module.exports = new BrandsService();
