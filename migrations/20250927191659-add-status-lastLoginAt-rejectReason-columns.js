'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add status column to users table
    await queryInterface.addColumn('users', 'status', {
      type: Sequelize.ENUM('active', 'banned'),
      allowNull: false,
      defaultValue: 'active'
    });

    // Add lastLoginAt column to users table
    await queryInterface.addColumn('users', 'lastLoginAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add reject_reason column to withdrawals table
    await queryInterface.addColumn('withdrawals', 'reject_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'status');
    await queryInterface.removeColumn('users', 'lastLoginAt');
    await queryInterface.removeColumn('withdrawals', 'reject_reason');
  }
};