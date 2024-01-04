const Size = require("../db/models/Size");
const productsService = require("./products.service");
const db = require("../db/database");

class SizesService {
  async createManyByProductId(productId, dto) {
    if (!(await productsService.existsWithId(productId)))
      throw new Error(`Product with id ${id} does not exist`);
    return Size.bulkCreate(
      dto.map((size) => ({
        productId,
        size,
      }))
    );
  }

  async createMany(dto) {
    return Size.bulkCreate(dto);
  }

  async getOneById(id) {
    const size = await Size.findOne({ where: { id } });
    if (!size) throw new Error(`Size with id ${id} does not exist`);
    return size;
  }

  async getManyByProductId(productId) {
    if (!(await productsService.existsWithId(productId)))
      throw new Error(`Product with id ${id} does not exist`);
    return Size.findAll({ where: { productId } });
  }

  async deleteManyByProductId(productId, dto) {
    if (!(await productsService.existsWithId(productId)))
      throw new Error(`Product with id ${id} does not exist`);
    return Size.destroy({
      where: {
        productId,
        size: dto,
      },
    });
  }

  async deleteMany(ids) {
    return Size.destroy({
      where: {
        id: ids,
      },
    });
  }
}

module.exports = new SizesService();
