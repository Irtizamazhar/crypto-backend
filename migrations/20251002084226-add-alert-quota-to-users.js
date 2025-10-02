"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // freeAlertsLimit: how many free alerts a user can ever create (lifetime cap)
    await queryInterface.addColumn("users", "freeAlertsLimit", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 2,
      comment: "Lifetime free alerts cap",
    });

    // freeAlertsUsed: how many free alerts the user has already created (lifetime count)
    await queryInterface.addColumn("users", "freeAlertsUsed", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: "Lifetime free alerts consumed",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "freeAlertsLimit");
    await queryInterface.removeColumn("users", "freeAlertsUsed");
  },
};
