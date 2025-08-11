// migrations/XXXXXXXXXXXXXX-create-payroll-table.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Payrolls', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staffId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Staffs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      month: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      basicSalary: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      commission: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      deductions: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      netPayable: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'GENERATED', 'PAID'),
        defaultValue: 'PENDING'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add compound unique index to prevent duplicate payroll records
    await queryInterface.addIndex('Payrolls', ['staffId', 'month'], {
      unique: true,
      name: 'payroll_unique_staff_month'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Payrolls');
  }
};