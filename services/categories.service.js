const Category = require("../db/models/Category");
const db = require("../db/database");
const { Op } = require("sequelize");

class CategoriesService {
  async create(dto) {
    if (await this.existsWithName(dto.name))
      throw new Error(`Category with name '${dto.name}' already exists`);
    if (dto.parentId) {
      const parent = await this.getOneById(dto.parentId);
      if (parent.parentId !== null)
        throw new Error("Category could not be a subcategory of a subcategory");
    }
    return Category.create({ name: dto.name, parentId: dto.parentId });
  }

  async getOneById(id, options) {
    const category = await Category.findOne({
      where: { id },
      include: {
        model: Category,
        as: "subcategories",
        ...(options.where.subcategories.id.length && {
          where: { id: { [Op.in]: options.where.subcategories.id } },
        }),
      },
    });
    if (!category) throw new Error(`Category with id ${id} does not exist`);
    return category;
  }

  async getMany() {
    return Category.findAll({ where: { parentId: { [Op.is]: null } } });
  }

  async update(id, dto) {
    const category = await this.getOneById(id);
    if (await this.existsWithName(dto.name))
      throw new Error(`Category with name '${dto.name}' already exists`);
    category.name = dto.name;
    return category.save();
  }

  async delete(id) {
    const category = await this.getOneById(id);
    category.destroy();
    return { message: `Category with id ${id} was deleted successfully` };
  }

  async isSubCategory(parentId, categoryId) {
    const count = await Category.count({
      where: {
        parentId,
        id: categoryId.length ? { [Op.in]: categoryId } : categoryId,
      },
    });
    return categoryId.length ? count === categoryId.length : count === 1;
  }

  async existsWithName(name) {
    const [{ exists }] = await db.query(
      `SELECT EXISTS (SELECT 1 FROM "categories" WHERE "name" LIKE :name)`,
      {
        replacements: { name },
        type: db.QueryTypes.SELECT,
      }
    );
    return exists;
  }

  async existsWithId(id) {
    const [{ exists }] = await db.query(
      `SELECT EXISTS (SELECT 1 FROM "categories" WHERE "id" = :id)`,
      {
        replacements: { id },
        type: db.QueryTypes.SELECT,
      }
    );
    return exists;
  }
}

module.exports = new CategoriesService();
