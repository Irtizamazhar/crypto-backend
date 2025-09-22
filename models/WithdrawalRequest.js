"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class WithdrawalRequest extends Model {
    static associate(models) {
      WithdrawalRequest.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      WithdrawalRequest.belongsTo(models.User, { foreignKey: "decidedBy", as: "decider" });
    }
  }

  WithdrawalRequest.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
      note: { type: DataTypes.STRING(500), allowNull: true },
      status: { type: DataTypes.ENUM("pending", "approved", "rejected"), allowNull: false, defaultValue: "pending" },
      decidedAt: { type: DataTypes.DATE, allowNull: true },
      decidedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    },
    { sequelize, modelName: "WithdrawalRequest", tableName: "withdrawal_requests" }
  );

  return WithdrawalRequest;
};
