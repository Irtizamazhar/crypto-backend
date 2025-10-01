"use strict";
module.exports = (sequelize, DataTypes) => {
  const PostComment = sequelize.define("PostComment", {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    post_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
  }, {
    tableName: "post_comments",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [{ fields: ["post_id","created_at"] }],
  });

  PostComment.associate = (models) => {
    PostComment.belongsTo(models.Post, { foreignKey: "post_id" });
    PostComment.belongsTo(models.User, { foreignKey: "user_id", as: "author" });
  };

  return PostComment;
};
