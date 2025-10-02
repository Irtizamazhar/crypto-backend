// server/models/Payment.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
  }
  Payment.init(
    {
      id: { type: DataTypes.STRING(64), primaryKey: true }, // uuid (no dashes)
      userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      plan: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "pro" },
      amount: { type: DataTypes.DECIMAL(18, 6), allowNull: false },
      toAddress: { type: DataTypes.STRING(64), allowNull: false },
      status: { type: DataTypes.ENUM("pending", "paid", "failed"), allowNull: false, defaultValue: "pending" },
      txid: { type: DataTypes.STRING(128), allowNull: true },
    },
    { sequelize, modelName: "Payment", tableName: "payments", timestamps: true }
  );
  return Payment;
};
