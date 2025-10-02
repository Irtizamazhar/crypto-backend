"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payments", {
      id: { type: Sequelize.STRING(64), primaryKey: true },
      userId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      plan: { type: Sequelize.STRING(32), allowNull: false, defaultValue: "pro" },
      amount: { type: Sequelize.DECIMAL(18, 6), allowNull: false },
      toAddress: { type: Sequelize.STRING(64), allowNull: false },
      status: {
        type: Sequelize.ENUM("pending", "paid", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      txid: { type: Sequelize.STRING(128) },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Optional but recommended indexes
    await queryInterface.addIndex("payments", ["userId"]);
    await queryInterface.addIndex("payments", ["toAddress"]);
    await queryInterface.addIndex("payments", ["status"]);
    await queryInterface.addIndex("payments", ["txid"]);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex("payments", ["userId"]).catch(() => {});
    await queryInterface.removeIndex("payments", ["toAddress"]).catch(() => {});
    await queryInterface.removeIndex("payments", ["status"]).catch(() => {});
    await queryInterface.removeIndex("payments", ["txid"]).catch(() => {});

    // Drop the table
    await queryInterface.dropTable("payments");

    // If you're on Postgres, also drop the ENUM type to avoid redefinition issues
    // (MySQL ignores this)
    if (queryInterface.sequelize.getDialect() === "postgres") {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_payments_status";`);
    }
  },
};
