const Sequelize = require("sequelize");
const db = require("../database");
const Size = require("./Size");

const Product = db.define(
  "products",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    modelId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    code: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    price: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  { timestamps: false }
);
Product.hasMany(Size, {
  onDelete: "CASCADE",
  foreignKey: "productId",
  as: "sizes",
});
Size.belongsTo(Product);
module.exports = Product;
