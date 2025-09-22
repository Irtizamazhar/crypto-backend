/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("users");

    // helper to add a column only if it doesn't exist
    const addIfMissing = async (name, spec) => {
      if (table[name]) return; // already exists
      await queryInterface.addColumn("users", name, spec);
    };

    // Fiat/USDT
    await addIfMissing("fiatUsd", {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    });

    await addIfMissing("fiatHistory", {
      type: Sequelize.JSON, // if your DB doesn't support JSON, switch to Sequelize.TEXT
      allowNull: false,
      defaultValue: [],
    });

    // PAPER
    await addIfMissing("paper", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 150,
    });

    await addIfMissing("paperStreak", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await addIfMissing("paperLastClaimAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await addIfMissing("paperHistory", {
      type: Sequelize.JSON, // if your DB doesn't support JSON, switch to Sequelize.TEXT
      allowNull: false,
      defaultValue: [],
    });

    // Gamification
    await addIfMissing("tapCount", {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    });

    await addIfMissing("userLevel", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("users");

    // helper to remove a column only if it exists
    const removeIfExists = async (name) => {
      if (!table[name]) return; // not present
      await queryInterface.removeColumn("users", name);
    };

    await removeIfExists("fiatUsd");
    await removeIfExists("fiatHistory");

    await removeIfExists("paper");
    await removeIfExists("paperStreak");
    await removeIfExists("paperLastClaimAt");
    await removeIfExists("paperHistory");

    await removeIfExists("tapCount");
    await removeIfExists("userLevel");
  },
};
