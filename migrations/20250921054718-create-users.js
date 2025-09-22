"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      email: { type: Sequelize.STRING(160), allowNull: false, unique: true },
      password: { type: Sequelize.STRING(200), allowNull: true }, // null for social providers
      role: { type: Sequelize.ENUM("user", "admin"), allowNull: false, defaultValue: "user" },
      provider: { type: Sequelize.ENUM("local", "google", "facebook", "apple"), allowNull: false, defaultValue: "local" },
      providerId: { type: Sequelize.STRING(191), allowNull: true },
      avatar: { type: Sequelize.STRING(500), allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
    // In MySQL the ENUM type is tied to the table; these are safe-guards
    try { await queryInterface.sequelize.query("DROP TYPE IF EXISTS `enum_users_role`;"); } catch {}
    try { await queryInterface.sequelize.query("DROP TYPE IF EXISTS `enum_users_provider`;"); } catch {}
  }
};
