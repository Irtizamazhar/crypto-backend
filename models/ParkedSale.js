// models/ParkedSale.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const ParkedSale = sequelize.define('ParkedSale', {
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Customers',
        key: 'id'
      }
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Staffs',
        key: 'id'
      }
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    tip: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'parked_sales',
    timestamps: true,
    createdAt: 'created_at',  // Explicitly map createdAt to created_at
    updatedAt: 'updated_at',  // Explicitly map updatedAt to updated_at
    underscored: true
  });

  ParkedSale.associate = function(models) {
    ParkedSale.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer'
    });
    ParkedSale.belongsTo(models.Staff, {
      foreignKey: 'staff_id',
      as: 'staff'
    });
  };

  return ParkedSale;
};