"use strict";

module.exports = (sequelize, DataTypes) => {
  const UserAddress = sequelize.define(
    "UserAddress",
    {
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users", // refers to table name
          key: "id", // column name in the users table
        },
        onDelete: "CASCADE", // if a user is deleted, their addresses should be deleted too
      },
      network: DataTypes.STRING(16),
      address: DataTypes.STRING(64),
      derivation_index: DataTypes.INTEGER,
      last_seen_ts: DataTypes.BIGINT,
    },
    {
      tableName: "user_addresses",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // Association
  UserAddress.associate = (models) => {
    UserAddress.belongsTo(models.User, { foreignKey: "user_id" });
  };

  return UserAddress;
};
