module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('StockLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      productName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      reason: {
        type: Sequelize.STRING
      },
      change: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      newQuantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      referenceId: {
        type: Sequelize.STRING
      },
      notes: {
        type: Sequelize.TEXT
      },
      productId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('StockLogs');
  }
};