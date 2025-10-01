"use strict";

module.exports = (sequelize, DataTypes) => {
  const Deposit = sequelize.define(
    "Deposit",
    {
      user_id: DataTypes.BIGINT,
      network: DataTypes.STRING(16),
      address: DataTypes.STRING(64),
      txid: DataTypes.STRING(128),
      amount_usdt: DataTypes.DECIMAL(18, 6),
      status: DataTypes.STRING(16),
      block_ts: DataTypes.BIGINT,
      credited_at: DataTypes.DATE,
    },
    {
      tableName: "deposits",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );
  Deposit.associate = (models) => {
    Deposit.belongsTo(models.User, { foreignKey: "user_id" });
  };
  return Deposit;
};