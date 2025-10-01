"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "plan", {
      type: Sequelize.ENUM("free", "pro"),
      allowNull: false,
      defaultValue: "free",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "plan");
  },
};
