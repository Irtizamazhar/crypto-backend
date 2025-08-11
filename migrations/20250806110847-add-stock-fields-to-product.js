module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Products', 'currentStock', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    
    await queryInterface.addColumn('Products', 'lastStockUpdate', {
      type: Sequelize.DATE,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Products', 'currentStock');
    await queryInterface.removeColumn('Products', 'lastStockUpdate');
  }
};