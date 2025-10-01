// server/migrations/20241001-001-add-payout-tracking-to-lottery-rounds.js
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("lottery_rounds");

    // If you somehow don't have entryUsd yet, add it (safe-guard)
    if (!table.entryUsd) {
      await queryInterface.addColumn("lottery_rounds", "entryUsd", {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      });
    }

    if (!table.payout_txid) {
      await queryInterface.addColumn("lottery_rounds", "payout_txid", {
        type: Sequelize.STRING(128),
        allowNull: true,
      });
    }
    if (!table.payout_status) {
      await queryInterface.addColumn("lottery_rounds", "payout_status", {
        type: Sequelize.ENUM("pending", "broadcast", "confirmed", "failed", "skipped"),
        allowNull: false,
        defaultValue: "pending",
      });
    }
    if (!table.paidAt) {
      await queryInterface.addColumn("lottery_rounds", "paidAt", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
    if (!table.adminNote) {
      await queryInterface.addColumn("lottery_rounds", "adminNote", {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    // Helpful indexes (ignore if they already exist)
    try {
      await queryInterface.addIndex(
        "lottery_rounds",
        ["entryUsd", "resolved"],
        { name: "idx_rounds_entryusd_resolved" }
      );
    } catch {}
    try {
      await queryInterface.addIndex(
        "lottery_rounds",
        ["resolvesAt"],
        { name: "idx_rounds_resolvesAt" }
      );
    } catch {}
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("lottery_rounds");

    if (table.adminNote) await queryInterface.removeColumn("lottery_rounds", "adminNote");
    if (table.paidAt) await queryInterface.removeColumn("lottery_rounds", "paidAt");
    if (table.payout_status) await queryInterface.removeColumn("lottery_rounds", "payout_status");
    if (table.payout_txid) await queryInterface.removeColumn("lottery_rounds", "payout_txid");

    // Only needed for Postgres; MySQL ignores this.
    if (queryInterface.sequelize.getDialect() === "postgres") {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_lottery_rounds_payout_status";'
      );
    }
    // NOTE: We do NOT drop entryUsd in down() because your app depends on it.
  },
};
