"use strict";

module.exports = (sequelize, DataTypes) => {
  const KvCounter = sequelize.define(
    "KvCounter",
    {
      key: { type: DataTypes.STRING(64), primaryKey: true },
      value_int: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: "kv_counters",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return KvCounter;
};