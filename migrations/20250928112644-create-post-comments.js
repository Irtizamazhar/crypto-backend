"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("post_comments", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      post_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      text: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    }, {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    });

    await queryInterface.addIndex("post_comments", ["post_id", "created_at"], { name: "idx_pc_post_created" });

    // FKs
    try {
      await queryInterface.addConstraint("post_comments", {
        fields: ["post_id"],
        type: "foreign key",
        name: "fk_pc_post",
        references: { table: "posts", field: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    } catch (_) {}
    try {
      await queryInterface.addConstraint("post_comments", {
        fields: ["user_id"],
        type: "foreign key",
        name: "fk_pc_user",
        references: { table: "users", field: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    } catch (_) {}
  },

  async down(queryInterface, Sequelize) {
    try { await queryInterface.removeConstraint("post_comments", "fk_pc_post"); } catch (_) {}
    try { await queryInterface.removeConstraint("post_comments", "fk_pc_user"); } catch (_) {}
    try { await queryInterface.removeIndex("post_comments", "idx_pc_post_created"); } catch (_) {}
    await queryInterface.dropTable("post_comments");
  }
};
