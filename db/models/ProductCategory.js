const Sequelize = require("sequelize");
const db = require("../database");
const Product = require("./Product");
const Category = require("./Category");

const ProductCategory = db.define(
  "products_categories",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    productId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      references: {
        model: Product,
        key: "id",
      },
    },
    categoryId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      references: {
        model: Category,
        key: "id",
      },
    },
  },
  { timestamps: false }
);

module.exports = ProductCategory;
