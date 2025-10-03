// models/User.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.UserAddress, { foreignKey: "user_id" });
      User.hasMany(models.Deposit, { foreignKey: "user_id" });
      User.hasMany(models.Withdrawal, { foreignKey: "user_id" });
    }
  }

  User.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      password: { type: DataTypes.STRING(200), allowNull: true },

      role: { type: DataTypes.ENUM("user", "admin"), allowNull: false, defaultValue: "user" },
      status: { type: DataTypes.ENUM("active", "banned"), allowNull: false, defaultValue: "active" },

      provider: { type: DataTypes.ENUM("local", "google", "facebook", "apple"), allowNull: false, defaultValue: "local" },
      providerId: { type: DataTypes.STRING(191), allowNull: true },

      avatar: { type: DataTypes.STRING(500), allowNull: true },

      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      lastLoginAt: { type: DataTypes.DATE, allowNull: true },

      fiatUsd: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      fiatHistory: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },

      paper: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      paperStreak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      paperLastClaimAt: { type: DataTypes.DATE, allowNull: true },
      paperHistory: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      tapCount: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, defaultValue: 0 },
      userLevel: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },

      // alerts quota
      freeAlertsLimit: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 2 },
      freeAlertsUsed:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },

      plan: { type: DataTypes.ENUM("free", "pro"), allowNull: false, defaultValue: "free" },

      // 🔵 NEW: referral & spin fields
      referralCode: { type: DataTypes.STRING(32), allowNull: true, unique: true },
      referredBy:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      referralCount:{ type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },

      hasSpun:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // lucky wheel once
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      underscored: false,
      freezeTableName: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return User;
};
