"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = "users";
    const tableDesc = await queryInterface.describeTable(table);

    if (!tableDesc.fiatUsd) {
      await queryInterface.addColumn(table, "fiatUsd", {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }
    if (!tableDesc.fiatHistory) {
      await queryInterface.addColumn(table, "fiatHistory", {
        type: Sequelize.JSON, // for MySQL 5.7+ / Postgres. If not available, switch to TEXT and JSON.parse/stringify at app layer
        allowNull: false,
        defaultValue: [],
      });
    }
  },

  async down(queryInterface) {
    const table = "users";
    await queryInterface.removeColumn(table, "fiatUsd");
    await queryInterface.removeColumn(table, "fiatHistory");
  },
};
