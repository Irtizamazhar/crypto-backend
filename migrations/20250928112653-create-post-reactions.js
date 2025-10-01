"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("post_reactions", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      post_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      kind: { type: Sequelize.ENUM("like","rocket","fire","think"), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    }, {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    });

    // unique toggle (one kind per user per post)
    await queryInterface.addConstraint("post_reactions", {
      fields: ["post_id","user_id","kind"],
      type: "unique",
      name: "uq_post_reactions_unique",
    });

    // FKs
    try {
      await queryInterface.addConstraint("post_reactions", {
        fields: ["post_id"],
        type: "foreign key",
        name: "fk_pr_post",
        references: { table: "posts", field: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    } catch (_) {}
    try {
      await queryInterface.addConstraint("post_reactions", {
        fields: ["user_id"],
        type: "foreign key",
        name: "fk_pr_user",
        references: { table: "users", field: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    } catch (_) {}
  },

  async down(queryInterface, Sequelize) {
    try { await queryInterface.removeConstraint("post_reactions", "uq_post_reactions_unique"); } catch (_) {}
    try { await queryInterface.removeConstraint("post_reactions", "fk_pr_post"); } catch (_) {}
    try { await queryInterface.removeConstraint("post_reactions", "fk_pr_user"); } catch (_) {}
    await queryInterface.dropTable("post_reactions");

    // Drop ENUM type if Postgres (ignored by MySQL)
    try { await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_post_reactions_kind\";"); } catch (_) {}
  }
};
