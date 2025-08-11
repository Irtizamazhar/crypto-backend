'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add foreign key constraints if they don't exist
    await queryInterface.addConstraint('Appointments', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'appointments_customer_id_fkey',
      references: {
        table: 'Customers',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Appointments', {
      fields: ['staff_id'],
      type: 'foreign key',
      name: 'appointments_staff_id_fkey',
      references: {
        table: 'Staffs',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Appointments', {
      fields: ['service_id'],
      type: 'foreign key',
      name: 'appointments_service_id_fkey',
      references: {
        table: 'Services',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Add status validation constraint
    await queryInterface.addConstraint('Appointments', {
      fields: ['status'],
      type: 'check',
      name: 'appointments_status_check',
      where: {
        status: ['scheduled', 'completed', 'cancelled', 'no-show']
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('Appointments', ['customer_id']);
    await queryInterface.addIndex('Appointments', ['staff_id']);
    await queryInterface.addIndex('Appointments', ['appointment_date']);
    await queryInterface.addIndex('Appointments', ['status']);
  },

  async down(queryInterface, Sequelize) {
    // Remove constraints
    await queryInterface.removeConstraint('Appointments', 'appointments_customer_id_fkey');
    await queryInterface.removeConstraint('Appointments', 'appointments_staff_id_fkey');
    await queryInterface.removeConstraint('Appointments', 'appointments_service_id_fkey');
    await queryInterface.removeConstraint('Appointments', 'appointments_status_check');
    
    // Remove indexes
    await queryInterface.removeIndex('Appointments', ['customer_id']);
    await queryInterface.removeIndex('Appointments', ['staff_id']);
    await queryInterface.removeIndex('Appointments', ['appointment_date']);
    await queryInterface.removeIndex('Appointments', ['status']);
  }
};