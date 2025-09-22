"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {}
  }

  User.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      password: { type: DataTypes.STRING(200), allowNull: true }, // null for social providers
      role: { type: DataTypes.ENUM("user", "admin"), allowNull: false, defaultValue: "user" },
      provider: { type: DataTypes.ENUM("local", "google", "facebook", "apple"), allowNull: false, defaultValue: "local" },
      providerId: { type: DataTypes.STRING(191), allowNull: true },
      avatar: { type: DataTypes.STRING(500), allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

      // ===== Fiat/USDT wallet =====
      fiatUsd: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      fiatHistory: {
        // Switch to TEXT if your DB lacks JSON
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },

      // ===== PAPER wallet =====
      paper: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 150 }, // integer points
      paperStreak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      paperLastClaimAt: { type: DataTypes.DATE, allowNull: true },
      paperHistory: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },

      // ===== Gamification =====
      tapCount: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, defaultValue: 0 },
      userLevel: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 }, // 0,1,2,3...
    },
    { sequelize, modelName: "User", tableName: "users" }
  );

  return User;
};
