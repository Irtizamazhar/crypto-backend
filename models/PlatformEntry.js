"use strict";

module.exports = (sequelize, DataTypes) => {
  const PlatformEntry = sequelize.define(
    "PlatformEntry",
    {
      delta_usdt: DataTypes.DECIMAL(18, 6),
      balance_after_usdt: DataTypes.DECIMAL(18, 6),
      type: DataTypes.STRING(24),
      ref_type: DataTypes.STRING(32),
      ref_id: DataTypes.BIGINT,
    },
    {
      tableName: "platform_entries",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );
  return PlatformEntry;
};