// server/migrations/20251003_refactor_replies_and_single_reaction.js
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) Add parent_id to post_comments if missing
    const commentsDesc = await queryInterface.describeTable("post_comments");
    if (!commentsDesc.parent_id) {
      await queryInterface.addColumn("post_comments", "parent_id", {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      });
      await queryInterface.addIndex("post_comments", ["parent_id"]);
    }

    // 2) Enforce single reaction per (post_id, user_id)
    // 2a) De-duplicate existing rows per (post_id, user_id), keep newest id
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === "postgres") {
      await queryInterface.sequelize.query(`
        DELETE FROM post_reactions pr1
        USING post_reactions pr2
        WHERE pr1.post_id = pr2.post_id
          AND pr1.user_id = pr2.user_id
          AND pr1.id < pr2.id;
      `);
    } else {
      await queryInterface.sequelize.query(`
        DELETE pr1 FROM post_reactions pr1
        INNER JOIN post_reactions pr2
          ON pr1.post_id = pr2.post_id
         AND pr1.user_id = pr2.user_id
         AND pr1.id < pr2.id;
      `);
    }

    // 2b) Drop any previous unique index (post_id, user_id, kind)
    // try by name (common), then by fields signature
    const dropCandidates = [
      "post_reactions_unique_post_user_kind",
      "post_reactions_post_id_user_id_kind",
      "post_reactions_post_id_user_id_kind_unique",
    ];
    for (const name of dropCandidates) {
      try { await queryInterface.removeIndex("post_reactions", name); } catch (_) {}
    }
    try { await queryInterface.removeIndex("post_reactions", ["post_id", "user_id", "kind"]); } catch (_) {}

    // 2c) Create unique index on (post_id, user_id)
    await queryInterface.addIndex("post_reactions", ["post_id", "user_id"], {
      unique: true,
      name: "post_reactions_unique_post_user",
    });

    // (optional) ensure a non-unique index on kind exists for filtering
    try {
      await queryInterface.addIndex("post_reactions", ["kind"]);
    } catch (_) {}
  },

  async down(queryInterface, Sequelize) {
    // Remove parent_id
    const commentsDesc = await queryInterface.describeTable("post_comments");
    if (commentsDesc.parent_id) {
      try { await queryInterface.removeIndex("post_comments", ["parent_id"]); } catch (_) {}
      await queryInterface.removeColumn("post_comments", "parent_id");
    }

    // Revert index change on post_reactions
    try { await queryInterface.removeIndex("post_reactions", "post_reactions_unique_post_user"); } catch (_) {}
    // restore old unique (post_id, user_id, kind)
    await queryInterface.addIndex("post_reactions", ["post_id", "user_id", "kind"], {
      unique: true,
      name: "post_reactions_unique_post_user_kind",
    });
  },
};
