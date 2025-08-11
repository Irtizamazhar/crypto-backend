'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sale extends Model {
    static associate(models) {
      Sale.hasMany(models.SaleItem, {
        foreignKey: "saleId",
        as: "items"
      });
      Sale.belongsTo(models.Customer, { 
        foreignKey: "customerId", 
        as: "customer" 
      });
      Sale.belongsTo(models.Staff, { 
        foreignKey: "staffId", 
        as: "staff" 
      });
    }

    async updateCommission() {
      if (!this.staffId) return;
      
      const staff = await this.getStaff();
      if (!staff) return;
      
      let totalCommission = 0;
      const items = await this.getItems();
      
      // Calculate commission for each item
      for (const item of items) {
        if (item.type === 'service') {
          const service = await sequelize.models.Service.findByPk(item.itemId);
          if (service && service.commission) {
            totalCommission += (item.price * item.quantity) * (service.commission / 100);
          }
        } else if (item.type === 'product') {
          const product = await sequelize.models.Product.findByPk(item.itemId);
          if (product && product.commissionRate) {
            totalCommission += (item.price * item.quantity) * (product.commissionRate / 100);
          }
        }
      }
      
      // Fallback to staff's base commission rate if no specific commission
      if (totalCommission === 0 && staff.commission_rate) {
        totalCommission = this.total * (staff.commission_rate / 100);
      }
      
      this.commission = parseFloat(totalCommission.toFixed(2));
      
      // Update staff performance metrics if this is a new sale
      if (this.isNewRecord) {
        await this.updateStaffPerformance();
      }
    }

    async updateStaffPerformance() {
      await sequelize.models.Staff.update(
        {
          performance_metrics: sequelize.literal(`
            jsonb_set(
              COALESCE("performance_metrics", '{"total_customers":0, "total_revenue":0, "total_commission":0, "average_rating":0, "attendance_rate":0}'::jsonb),
              '{total_customers}',
              (COALESCE("performance_metrics"->>'total_customers', '0')::int + 1)::text::jsonb
            )
          `),
          updatedAt: new Date()
        },
        { where: { id: this.staffId } }
      );
    }
  }

  Sale.init({
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Customers',
        key: 'id'
      }
    },
    staffId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Staffs',
        key: 'id'
      }
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    tip: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [['cash', 'credit', 'debit', 'transfer', 'other']]
      }
    },
    paymentAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    commission: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    createdAt: {  // Changed from sale_date to createdAt to match your actual DB
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {  // Explicitly defining updatedAt for clarity
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Sale',
    timestamps: true,  // Ensure Sequelize manages createdAt/updatedAt
    hooks: {
      beforeSave: async (sale, options) => {
        if (sale.staffId && (sale.isNewRecord || sale.changed('total') || sale.changed('staffId'))) {
          await sale.updateCommission();
        }
      },
      afterCreate: async (sale, options) => {
        if (sale.staffId) {
          await sale.updateStaffPerformance();
        }
      }
    }
  });

  return Sale;
};