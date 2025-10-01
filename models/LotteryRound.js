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

      // make sure this is present (your app uses tiers 1/5/10)
      entryUsd: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },

      // NEW payout tracking fields
      payout_txid: { type: DataTypes.STRING(128), allowNull: true },
      payout_status: {
        type: DataTypes.ENUM("pending", "broadcast", "confirmed", "failed", "skipped"),
        allowNull: false,
        defaultValue: "pending",
      },
      paidAt: { type: DataTypes.DATE, allowNull: true },
      adminNote: { type: DataTypes.STRING(500), allowNull: true },
    },
    {
      sequelize,
      modelName: "LotteryRound",
      tableName: "lottery_rounds",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return LotteryRound;
};
