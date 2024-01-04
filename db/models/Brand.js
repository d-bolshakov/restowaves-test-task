const Sequelize = require("sequelize");
const db = require("../database");
const Model = require("./Model");

const Brand = db.define(
  "brands",
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
  },
  { timestamps: false }
);

Brand.hasMany(Model, {
  onDelete: "CASCADE",
  foreignKey: "brandId",
  as: "models",
});
Model.belongsTo(Brand);
module.exports = Brand;
