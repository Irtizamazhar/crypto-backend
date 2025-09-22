"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "fiatUsd", {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn("users", "paper", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 150
    });
    await queryInterface.addColumn("users", "paperStreak", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn("users", "paperLastClaimAt", {
      type: Sequelize.DATE,
      allowNull: true
    });
    // Prefer JSON if supported
    await queryInterface.addColumn("users", "paperHistory", {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.removeColumn("users", "paperHistory");
    await queryInterface.removeColumn("users", "paperLastClaimAt");
    await queryInterface.removeColumn("users", "paperStreak");
    await queryInterface.removeColumn("users", "paper");
    await queryInterface.removeColumn("users", "fiatUsd");
  }
};
