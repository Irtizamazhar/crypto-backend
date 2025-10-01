"use strict";
module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define("Post", {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

    type: { type: DataTypes.ENUM("post","news","trade"), allowNull: false, defaultValue: "post" },
    text: { type: DataTypes.TEXT, allowNull: true },
    coin: { type: DataTypes.STRING(16), allowNull: true },
    url: { type: DataTypes.STRING(512), allowNull: true },
    title: { type: DataTypes.STRING(256), allowNull: true },
    sentiment: { type: DataTypes.ENUM("bullish","bearish","neutral"), allowNull: true },

    // trade-only extras (optional)
    side: { type: DataTypes.ENUM("UP","DOWN"), allowNull: true },
    amount: { type: DataTypes.DECIMAL(18,2), allowNull: true },

    // counters
    like_count:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    rocket_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    fire_count:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    think_count:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    comment_count:{ type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  }, {
    tableName: "posts",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["created_at"] },
      { fields: ["type"] },
      { fields: ["user_id"] },
    ],
  });

  Post.associate = (models) => {
    Post.belongsTo(models.User, { foreignKey: "user_id", as: "author" });
    Post.hasMany(models.PostComment, { foreignKey: "post_id", as: "comments" });
    Post.hasMany(models.PostReaction, { foreignKey: "post_id", as: "reactions" });
  };

  return Post;
};
