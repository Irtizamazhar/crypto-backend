'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      barcode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
      },
      subCategory: {
        type: Sequelize.STRING,
      },
      purchasingPrice: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      sellingPrice: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      usesRemaining: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      usesPerUnit: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      reorderLevel: {
        type: Sequelize.INTEGER,
        defaultValue: 10,
      },
      commissionRate: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM("In Stock", "Low Stock", "Out of Stock"),
        defaultValue: "In Stock",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Products');
  },
};
