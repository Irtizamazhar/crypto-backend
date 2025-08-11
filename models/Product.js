// models/Product.js
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define("Product", {
    name:           { type: DataTypes.STRING,  allowNull: false },
    barcode:        { type: DataTypes.STRING,  allowNull: false },
    category:       { type: DataTypes.STRING },
    subCategory:    { type: DataTypes.STRING },
    purchasingPrice:{ type: DataTypes.FLOAT,   allowNull: false },
    sellingPrice:   { type: DataTypes.FLOAT,   allowNull: false },
    currentStock:   { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    usesRemaining:  { type: DataTypes.INTEGER, allowNull: false },
    usesPerUnit:    { type: DataTypes.INTEGER, defaultValue: 1 },
    reorderLevel:   { type: DataTypes.INTEGER, defaultValue: 10 },
    commissionRate: { type: DataTypes.FLOAT,   defaultValue: 0 },
    status:         { type: DataTypes.ENUM("In Stock","Low Stock","Out of Stock"), defaultValue: "In Stock" },
    lastStockUpdate:{ type: DataTypes.DATE },
  });

  Product.associate = (models) => {
    Product.hasMany(models.StockLog, {
      foreignKey: "productId",
      as: "stockLogs",
    });
    Product.hasMany(models.ConsumableUsage, {
      foreignKey: "productId",
      as: "usages",
    });
  };

  // update status & timestamp on stock changes
  Product.beforeSave((product) => {
    if (product.changed("currentStock")) {
      product.lastStockUpdate = new Date();
      if (product.currentStock <= 0) product.status = "Out of Stock";
      else if (product.currentStock <= product.reorderLevel) product.status = "Low Stock";
      else product.status = "In Stock";
    }
  });

  return Product;
};
