"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("lottery_rounds", {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      resolvesAt: { type: Sequelize.DATE, allowNull: false },
      resolved: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      winnerUserId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      payout: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("lottery_rounds", ["resolved"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("lottery_rounds");
  },
};
