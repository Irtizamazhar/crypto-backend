"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Rain extends Model {
    static associate(models) {
      Rain.hasMany(models.RainGrab, { foreignKey: "rainId", as: "grabs" });
    }
  }

  Rain.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      endsAt: { type: DataTypes.DATE, allowNull: true },
      amountPerGrab: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0.1 },
      totalDrops: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 100 },
      claimedDrops: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    },
    { sequelize, modelName: "Rain", tableName: "rains", timestamps: true }
  );

  return Rain;
};
