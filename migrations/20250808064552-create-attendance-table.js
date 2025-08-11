// migrations/YYYYMMDDHHMMSS-create-attendance-table.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Attendances', {
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('present', 'absent', 'late', 'half-day'),
        allowNull: false,
        defaultValue: 'absent'
      },
      checkIn: {
        type: Sequelize.TIME,
        allowNull: true
      },
      checkOut: {
        type: Sequelize.TIME,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Add unique constraint for staffId and date combination
    await queryInterface.addConstraint('Attendances', {
      fields: ['staffId', 'date'],
      type: 'unique',
      name: 'unique_staff_date'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Attendances');
  }
};