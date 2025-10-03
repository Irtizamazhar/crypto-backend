"use strict";
module.exports = (sequelize, DataTypes) => {
  const PostReaction = sequelize.define(
    "PostReaction",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      post_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      kind: { type: DataTypes.ENUM("like", "rocket", "fire", "think"), allowNull: false },
    },
    {
      tableName: "post_reactions",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        // NEW: only one reaction per user per post
        { unique: true, fields: ["post_id", "user_id"], name: "post_reactions_unique_post_user" },
        // keep non-unique index on kind for filtering, optional
        { fields: ["kind"] },
      ],
    }
  );

  PostReaction.associate = (models) => {
    PostReaction.belongsTo(models.Post, { foreignKey: "post_id" });
    PostReaction.belongsTo(models.User, { foreignKey: "user_id" });
  };

  return PostReaction;
};
