// server/models/Alert.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Alert extends Model {
    static associate(models) {
      Alert.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
  }

  Alert.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

      coinId: { type: DataTypes.STRING(191), allowNull: false },
      symbol: { type: DataTypes.STRING(50), allowNull: false },
      name:   { type: DataTypes.STRING(191), allowNull: false },

      type: { type: DataTypes.ENUM("price", "pct24h", "vol24h"), allowNull: false },
      op:   { type: DataTypes.ENUM(">", "<"), allowNull: false, defaultValue: ">" },
      value:{ type: DataTypes.DECIMAL(24,10), allowNull: false },

      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { sequelize, modelName: "Alert", tableName: "alerts", timestamps: true }
  );

  return Alert;
};
