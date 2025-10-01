"use strict";

module.exports = (sequelize, DataTypes) => {
  const Withdrawal = sequelize.define(
    "Withdrawal",
    {
      user_id: DataTypes.BIGINT,
      network: DataTypes.STRING(16),
      to_address: DataTypes.STRING(64),
      amount_usdt: DataTypes.DECIMAL(18, 6),
      fee_usdt: DataTypes.DECIMAL(18, 6),
      status: DataTypes.STRING(16),
      txid: DataTypes.STRING(128),
      processed_at: DataTypes.DATE,
    },
    {
      tableName: "withdrawals",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );
  Withdrawal.associate = (models) => {
    Withdrawal.belongsTo(models.User, { foreignKey: "user_id" });
  };
  return Withdrawal;
};