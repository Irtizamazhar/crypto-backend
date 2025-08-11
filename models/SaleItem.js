module.exports = (sequelize, DataTypes) => {
  const SaleItem = sequelize.define("SaleItem", {
    saleId:   { type: DataTypes.INTEGER, allowNull: false },
    itemId:   { type: DataTypes.INTEGER, allowNull: false },
    type:     { type: DataTypes.STRING,  allowNull: false }, // "product" or "service"
    name:     { type: DataTypes.STRING,  allowNull: false },
    price:    { type: DataTypes.FLOAT,   allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  });

  SaleItem.associate = (models) => {
    SaleItem.belongsTo(models.Sale, { foreignKey: "saleId", as: "sale" });
  };

  return SaleItem;
};
