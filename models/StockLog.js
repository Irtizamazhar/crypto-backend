// models/StockLog.js
module.exports = (sequelize, DataTypes) => {
  const StockLog = sequelize.define("StockLog", {
    date:        { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    productName: { type: DataTypes.STRING, allowNull: false },
    reason:      { type: DataTypes.STRING },
    change:      { type: DataTypes.INTEGER, allowNull: false },
    newQuantity: { type: DataTypes.INTEGER, allowNull: false },
    referenceId: { type: DataTypes.STRING },
    notes:       { type: DataTypes.TEXT },
  });

  StockLog.associate = (models) => {
    StockLog.belongsTo(models.Product, {
      foreignKey: "productId",
      as: "product",
    });
  };

  return StockLog;
};
