// migrations/YYYYMMDDHHMMSS-update-staff-performance-metrics.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add performance_metrics column if it doesn't exist
    const tableInfo = await queryInterface.describeTable('Staffs');
    
    if (!tableInfo.performance_metrics) {
      await queryInterface.addColumn('Staffs', 'performance_metrics', {
        type: Sequelize.JSON,
        defaultValue: {
          total_customers: 0,
          total_revenue: 0,
          total_commission: 0,
          average_rating: 0,
          attendance_rate: 0
        }
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove performance_metrics column if it exists
    const tableInfo = await queryInterface.describeTable('Staffs');
    
    if (tableInfo.performance_metrics) {
      await queryInterface.removeColumn('Staffs', 'performance_metrics');
    }
  }
};