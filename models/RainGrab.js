"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class RainGrab extends Model {
    static associate(models) {
      RainGrab.belongsTo(models.Rain, { foreignKey: "rainId", as: "rain" });
      RainGrab.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
  }

  RainGrab.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      rainId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    },
    { sequelize, modelName: "RainGrab", tableName: "rain_grabs", timestamps: true }
  );

  return RainGrab;
};
