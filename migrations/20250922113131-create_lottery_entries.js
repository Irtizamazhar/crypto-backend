"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("lottery_entries", {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      roundId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "lottery_rounds", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    await queryInterface.addIndex("lottery_entries", ["roundId"]);
    await queryInterface.addIndex("lottery_entries", ["userId"]);
    await queryInterface.addConstraint("lottery_entries", {
      fields: ["roundId", "userId"],
      type: "unique",
      name: "uniq_round_user", // one ticket per user per round (change if you want multi-tickets)
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("lottery_entries");
  },
};
