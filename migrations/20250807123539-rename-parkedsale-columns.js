// migrations/YYYYMMDDHHMMSS-rename-parkedsale-columns.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the column exists first to avoid errors
    const describeTable = await queryInterface.describeTable('parked_sales');
    
    if (describeTable.createdAt) {
      await queryInterface.renameColumn('parked_sales', 'createdAt', 'created_at');
    }
    
    if (describeTable.updatedAt) {
      await queryInterface.renameColumn('parked_sales', 'updatedAt', 'updated_at');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // For rollback, rename them back
    const describeTable = await queryInterface.describeTable('parked_sales');
    
    if (describeTable.created_at) {
      await queryInterface.renameColumn('parked_sales', 'created_at', 'createdAt');
    }
    
    if (describeTable.updated_at) {
      await queryInterface.renameColumn('parked_sales', 'updated_at', 'updatedAt');
    }
  }
};