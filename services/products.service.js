const Product = require("../db/models/Product");
const Model = require("../db/models/Model");
const modelsService = require("./models.service");
const categoriesService = require("./categories.service");
const db = require("../db/database");
const { QueryTypes, Op } = require("sequelize");
const { escapeString } = require("../utils/escapeString.util");
const Size = require("../db/models/Size");
const Category = require("../db/models/Category");
const Brand = require("../db/models/Brand");

class ProductsService {
  async create(dto) {
    if (await this.existsWithName(dto.name))
      throw new Error(`Product with name ${dto.name} already exists`);
    if (!(await modelsService.existsWithId(dto.modelId)))
      throw new Error(`Model with id ${dto.modelId} does not exist`);
    return Product.create({
      id: dto.id,
      name: dto.name,
      modelId: dto.modelId,
      price: dto.price,
    });
  }

  async createMany(dto) {
    return Product.bulkCreate(dto);
  }

  async getOneById(id) {
    const product = await Product.findOne({
      where: { id },
      include: [
        {
          model: Category,
          as: "categories",
          through: {
            attributes: [],
          },
          attributes: ["id", "name", "parentId"],
        },
        {
          model: Size,
          as: "sizes",
          attributes: ["id", "size"],
        },
      ],
    });
    if (!product) throw new Error(`Product with id ${id} does not exist`);
    return product;
  }

  // метод отримання всіх продуктів
  // може приймати дто з фільтрами розмірів, моделей, брендів та категорій
  // параметри можуть бути масивами
  async getMany(filterDto) {
    const { size, modelId, categoryId, brandId } = filterDto;
    const options = { include: [] };
    if (size)
      options.include.push({
        model: Size,
        as: "sizes",
        where: {
          size: size.length > 1 ? { [Op.in]: size } : Number(size),
        },
        attributes: [],
      });
    if (modelId)
      options.include.push({
        model: Model,
        attributes: [],
        as: "model",
        where: {
          id: modelId.length > 1 ? { [Op.in]: modelId } : Number(modelId),
        },
      });
    if (categoryId)
      options.include.push({
        model: Category,
        as: "categories",
        where: {
          id:
            categoryId.length > 1
              ? { [Op.in]: categoryId }
              : Number(categoryId),
        },
        attributes: [],
        through: {
          attributes: [],
        },
      });
    if (brandId)
      options.include.push({
        model: Model,
        as: "model",
        attributes: [],
        where: {
          brandId: brandId.length > 1 ? { [Op.in]: brandId } : Number(brandId),
        },
      });
    return Product.findAll(options);
  }

  // метод для зміни назви та встановлення категорії та підкатегорій для товару
  async update(id, dto) {
    const { name, category } = dto;
    const product = await this.getOneById(id);
    if (name) {
      if (await this.existsWithName(name))
        throw new Error(`Product with name '${name}' already exists`);
      product.name = name;
    }
    if (price) product.price = price;
    if (category) {
      const mainCategory = await categoriesService.getOneById(category.id, {
        where: { subcategories: { id: category.subcategories } },
      });
      if (category.subcategories.length !== mainCategory.subcategories.length)
        throw new Error("One or more subcategories are invalid");
      await product.setCategories([
        mainCategory,
        ...mainCategory.subcategories,
      ]);
    }
    return product.save();
  }

  async updateMany(dto) {
    let query =
      'UPDATE "products" SET name = CASE ' +
      dto
        .map((p) => `WHEN id = ${p.id} THEN E'${escapeString(p.name)}'`)
        .join(" ") +
      " END, price = CASE " +
      dto.map((p) => `WHEN id = ${p.id} THEN ${p.price}`).join(" ") +
      ` END WHERE id IN (${dto.map((p) => p.id).join(",")})`;
    return db.query(query, {
      type: QueryTypes.UPDATE,
      raw: true,
    });
  }

  async delete(id) {
    const product = await this.getOneById(id);
    product.destroy();
    return { message: `Product with id ${id} was deleted successfully` };
  }

  async deleteMany(ids) {
    return Product.destroy({ where: { id: ids } });
  }

  // метод для перевірки існування товару з заданою назвою
  async existsWithName(name) {
    const [{ exists }] = await db.query(
      `SELECT EXISTS (SELECT 1 FROM "products" WHERE "name" LIKE :name)`,
      {
        replacements: { name },
        type: db.QueryTypes.SELECT,
      }
    );
    return exists;
  }

  // метод для перевірки існування товару з заданим айді
  async existsWithId(id) {
    const [{ exists }] = await db.query(
      `SELECT EXISTS (SELECT 1 FROM "products" WHERE "id" = :id)`,
      {
        replacements: { id },
        type: db.QueryTypes.SELECT,
      }
    );
    return exists;
  }
}

module.exports = new ProductsService();
