module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if 'user_id' column exists before adding it
    const hasUserIdColumn = await queryInterface.describeTable('user_addresses').then(columns => columns.hasOwnProperty('user_id'));

    if (!hasUserIdColumn) {
      // Add foreign key to user_addresses table if not already added
      await queryInterface.addColumn("user_addresses", "user_id", {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users", // references the users table
          key: "id", // column in the users table
        },
        onDelete: "CASCADE", // Ensures that if a user is deleted, their address is deleted as well
      });
    }

    // Check if the unique constraint already exists by querying the database
    const [results] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_NAME = 'user_addresses' AND CONSTRAINT_NAME = 'ua_user_network_uq';
    `);

    if (results.length === 0) {
      // Create the unique constraint if it does not exist
      await queryInterface.addConstraint("user_addresses", {
        fields: ["user_id", "network"],
        type: "unique",
        name: "ua_user_network_uq",
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the constraint and column if the migration is rolled back
    const [results] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_NAME = 'user_addresses' AND CONSTRAINT_NAME = 'ua_user_network_uq';
    `);

    if (results.length > 0) {
      await queryInterface.removeConstraint("user_addresses", "ua_user_network_uq");
    }

    const hasUserIdColumn = await queryInterface.describeTable('user_addresses').then(columns => columns.hasOwnProperty('user_id'));

    if (hasUserIdColumn) {
      await queryInterface.removeColumn("user_addresses", "user_id");
    }
  }
};
