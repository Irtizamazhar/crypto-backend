"use strict";

module.exports = (sequelize, DataTypes) => {
  const WalletEntry = sequelize.define(
    "WalletEntry",
    {
      user_id: DataTypes.BIGINT,
      delta_usdt: DataTypes.DECIMAL(18, 6),
      balance_after_usdt: DataTypes.DECIMAL(18, 6),
      type: DataTypes.STRING(16),
      ref_type: DataTypes.STRING(16),
      ref_id: DataTypes.BIGINT,
    },
    {
      tableName: "wallet_entries",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );
  WalletEntry.associate = (models) => {
    WalletEntry.belongsTo(models.User, { foreignKey: "user_id" });
  };
  return WalletEntry;
};