// models/ConsumableUsage.js
module.exports = (sequelize, DataTypes) => {
  const ConsumableUsage = sequelize.define("ConsumableUsage", {
    date:         { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    quantityUsed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    serviceName:  { type: DataTypes.STRING,  allowNull: false },
    notes:        { type: DataTypes.TEXT },
  });

  ConsumableUsage.associate = (models) => {
    ConsumableUsage.belongsTo(models.Product, {
      foreignKey: "productId",
      as: "product",
    });
  };

  return ConsumableUsage;
};
