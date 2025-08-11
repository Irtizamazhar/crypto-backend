module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Appointments', 'service_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Services', // The model we're linking to
        key: 'id', // The key in the Services table
      },
      allowNull: true,  // Set to true if this field is optional
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Appointments', 'service_id');
  },
};
