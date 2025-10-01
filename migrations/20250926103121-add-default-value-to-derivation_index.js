module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('user_addresses', 'derivation_index', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,  // Set default value for derivation_index
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('user_addresses', 'derivation_index', {
      type: Sequelize.INTEGER,
      allowNull: false,
      // If you need to revert to no default, set defaultValue to null
      defaultValue: null,  // Remove the default value
    });
  }
};
