'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Staffs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      father_name: {
        type: Sequelize.STRING,
      },
      dob: {
        type: Sequelize.DATEONLY,
      },
      cnic: {
        type: Sequelize.STRING,
        unique: true,
      },
      phone_number: {
        type: Sequelize.STRING,
      },
      address: {
        type: Sequelize.STRING,
      },
      experience: {
        type: Sequelize.STRING,
      },
      position: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      joining_date: {
        type: Sequelize.DATEONLY,
      },
      leave_date: {
        type: Sequelize.DATEONLY,
      },
      initial_salary: {
        type: Sequelize.FLOAT,
      },
      commission: {
        type: Sequelize.FLOAT,
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Staffs');
  },
};
