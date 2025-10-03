"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "referralCode", {
      type: Sequelize.STRING(32),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn("users", "referredBy", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addColumn("users", "referralCount", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn("users", "hasSpun", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // In case the dialect ignores `unique: true` above, ensure an index
    await queryInterface.addIndex("users", ["referralCode"], {
      unique: true,
      name: "users_referralCode_unique",
    });

    // Helpful for reverse lookup
    await queryInterface.addIndex("users", ["referredBy"], {
      name: "users_referredBy_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("users", "users_referralCode_unique").catch(() => {});
    await queryInterface.removeIndex("users", "users_referredBy_idx").catch(() => {});
    await queryInterface.removeColumn("users", "hasSpun");
    await queryInterface.removeColumn("users", "referralCount");
    await queryInterface.removeColumn("users", "referredBy");
    await queryInterface.removeColumn("users", "referralCode");
  },
};
