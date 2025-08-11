'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      invoice_email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      office_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      office_city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      office_eir_code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      delivery_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      delivery_city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      delivery_eir_code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true
      },
      company_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('customer', 'admin', 'super admin', 'sales', 'deliveries'),
        defaultValue: 'customer'
      },
      credit_limit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      isApproved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      subscribe: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
