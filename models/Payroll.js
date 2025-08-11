// models/Payroll.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payroll extends Model {
    static associate(models) {
      Payroll.belongsTo(models.Staff, {
        foreignKey: 'staffId',
        as: 'staff'
      });
    }
  }

  Payroll.init({
    staffId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Staffs',
        key: 'id'
      }
    },
    month: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    basicSalary: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    commission: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    deductions: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    netPayable: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'GENERATED', 'PAID'),
      defaultValue: 'PENDING'
    }
  }, {
    sequelize,
    modelName: 'Payroll',
    timestamps: true
  });

  return Payroll;
};