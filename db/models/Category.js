const Sequelize = require("sequelize");
const db = require("../database");
const Product = require("./Product");
const ProductCategory = require("./ProductCategory");

const Category = db.define(
  "categories",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    parentId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  },
  { timestamps: false }
);

Category.hasMany(Category, {
  onDelete: "CASCADE",
  foreignKey: "parentId",
  as: "subcategories",
});
Category.belongsToMany(Product, { through: ProductCategory });
Product.belongsToMany(Category, { through: ProductCategory, as: "categories" });
module.exports = Category;
