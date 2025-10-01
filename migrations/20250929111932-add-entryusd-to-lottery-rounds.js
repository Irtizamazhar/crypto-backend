"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) add the column with default 1
    await queryInterface.addColumn("lottery_rounds", "entryUsd", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    });

    // 2) (Optional but recommended) backfill nulls if any legacy rows exist
    await queryInterface.sequelize.query(
      "UPDATE `lottery_rounds` SET `entryUsd` = 1 WHERE `entryUsd` IS NULL"
    );

    // 3) helpful composite index for queries
    await queryInterface.addIndex("lottery_rounds", {
      fields: ["entryUsd", "resolved", "resolvesAt"],
      name: "lottery_rounds_entryUsd_resolved_resolvesAt_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      "lottery_rounds",
      "lottery_rounds_entryUsd_resolved_resolvesAt_idx"
    );
    await queryInterface.removeColumn("lottery_rounds", "entryUsd");
  },
};
