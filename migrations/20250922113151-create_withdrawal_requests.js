"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("withdrawal_requests", {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      note: { type: Sequelize.STRING(500), allowNull: true },
      status: { type: Sequelize.ENUM("pending", "approved", "rejected"), allowNull: false, defaultValue: "pending" },
      decidedAt: { type: Sequelize.DATE, allowNull: true },
      decidedBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    await queryInterface.addIndex("withdrawal_requests", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("withdrawal_requests");
  },
};
