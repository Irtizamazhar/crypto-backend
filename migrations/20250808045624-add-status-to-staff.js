'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Staffs', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Active'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Staffs', 'status');
  }
};