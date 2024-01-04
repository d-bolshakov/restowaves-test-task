const Sequelize = require("sequelize");
const db = require("../database");
const Product = require("./Product");

const Model = db.define(
  "models",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    brandId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
  },
  { timestamps: false }
);

Model.hasMany(Product, {
  onDelete: "CASCADE",
  foreignKey: "modelId",
  as: "products",
});
Product.belongsTo(Model, {
  as: "model",
  foreignKey: {
    name: "modelId",
  },
});
module.exports = Model;
