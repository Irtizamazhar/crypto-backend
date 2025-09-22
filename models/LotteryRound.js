"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class LotteryRound extends Model {
    static associate(models) {
      LotteryRound.hasMany(models.LotteryEntry, { foreignKey: "roundId", as: "entries" });
      LotteryRound.belongsTo(models.User, { foreignKey: "winnerUserId", as: "winner" });
    }
  }

  LotteryRound.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      resolvesAt: { type: DataTypes.DATE, allowNull: false },
      resolved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      winnerUserId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      payout: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    },
    { sequelize, modelName: "LotteryRound", tableName: "lottery_rounds" }
  );

  return LotteryRound;
};
