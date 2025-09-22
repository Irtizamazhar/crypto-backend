"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class LotteryEntry extends Model {
    static associate(models) {
      LotteryEntry.belongsTo(models.LotteryRound, { foreignKey: "roundId", as: "round" });
      LotteryEntry.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
  }

  LotteryEntry.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      roundId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    },
    { sequelize, modelName: "LotteryEntry", tableName: "lottery_entries" }
  );

  return LotteryEntry;
};
