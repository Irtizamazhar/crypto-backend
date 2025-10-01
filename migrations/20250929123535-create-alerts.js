"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("alerts", {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      userId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },

      coinId: { type: Sequelize.STRING(191), allowNull: false },
      symbol: { type: Sequelize.STRING(50),  allowNull: false },
      name:   { type: Sequelize.STRING(191), allowNull: false },

      type:  { type: Sequelize.ENUM("price","pct24h","vol24h"), allowNull: false },
      op:    { type: Sequelize.ENUM(">","<"), allowNull: false, defaultValue: ">" },
      value: { type: Sequelize.DECIMAL(24,10), allowNull: false },

      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });

    await queryInterface.addIndex("alerts", ["userId"]);
    await queryInterface.addIndex("alerts", ["userId", "coinId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("alerts");
  },
};
