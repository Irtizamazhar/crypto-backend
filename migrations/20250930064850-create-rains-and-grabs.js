"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rains", {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      endsAt: { type: Sequelize.DATE, allowNull: true },
      amountPerGrab: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0.1 },
      totalDrops: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 100 },
      claimedDrops: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });

    await queryInterface.createTable("rain_grabs", {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      rainId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: "rains", key: "id" }, onDelete: "CASCADE" },
      userId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: "users", key: "id" }, onDelete: "CASCADE" },
      amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });

    await queryInterface.addIndex("rain_grabs", ["rainId", "userId"], { unique: true, name: "uniq_rain_user" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("rain_grabs");
    await queryInterface.dropTable("rains");
  },
};
