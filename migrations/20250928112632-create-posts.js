"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("posts", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },

      type: { type: Sequelize.ENUM("post","news","trade"), allowNull: false, defaultValue: "post" },
      text: { type: Sequelize.TEXT, allowNull: true },
      coin: { type: Sequelize.STRING(16), allowNull: true },
      url: { type: Sequelize.STRING(512), allowNull: true },
      title: { type: Sequelize.STRING(256), allowNull: true },
      sentiment: { type: Sequelize.ENUM("bullish","bearish","neutral"), allowNull: true },

      side: { type: Sequelize.ENUM("UP","DOWN"), allowNull: true },
      amount: { type: Sequelize.DECIMAL(18,2), allowNull: true },

      like_count:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      rocket_count: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      fire_count:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      think_count:  { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      comment_count:{ type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
    }, {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    });

    // indexes
    await queryInterface.addIndex("posts", ["created_at"], { name: "idx_posts_created_at" });
    await queryInterface.addIndex("posts", ["type"], { name: "idx_posts_type" });
    await queryInterface.addIndex("posts", ["user_id"], { name: "idx_posts_user" });

    // (optional) FK to users.id — remove if you don't want FK
    try {
      await queryInterface.addConstraint("posts", {
        fields: ["user_id"],
        type: "foreign key",
        name: "fk_posts_user",
        references: { table: "users", field: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    } catch (_) { /* users table might not exist yet in some setups; safe to ignore */ }
  },

  async down(queryInterface, Sequelize) {
    // Clean up FKs and ENUMs before dropping the table (MySQL is tolerant)
    try { await queryInterface.removeConstraint("posts", "fk_posts_user"); } catch (_) {}
    try { await queryInterface.removeIndex("posts", "idx_posts_created_at"); } catch (_) {}
    try { await queryInterface.removeIndex("posts", "idx_posts_type"); } catch (_) {}
    try { await queryInterface.removeIndex("posts", "idx_posts_user"); } catch (_) {}

    await queryInterface.dropTable("posts");

    // Drop ENUM types if using Postgres (ignored by MySQL)
    try { await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_posts_type\";"); } catch (_) {}
    try { await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_posts_sentiment\";"); } catch (_) {}
    try { await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_posts_side\";"); } catch (_) {}
  }
};
