// models/Attendance.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {
    static associate(models) {
      Attendance.belongsTo(models.Staff, {
        foreignKey: 'staffId',
        as: 'staff'
      });
    }
  }
  
  Attendance.init({
    staffId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Staffs',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late', 'half-day'),
      allowNull: false,
      defaultValue: 'absent'
    },
    checkIn: {
      type: DataTypes.TIME,
      allowNull: true
    },
    checkOut: {
      type: DataTypes.TIME,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Attendance',
    indexes: [
      {
        unique: true,
        fields: ['staffId', 'date']
      }
    ]
  });

  return Attendance;
};