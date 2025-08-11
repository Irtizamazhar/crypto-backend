'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Staff extends Model {
    static associate(models) {
      Staff.hasMany(models.Sale, {
        foreignKey: 'staffId',
        as: 'sales'
      });
      Staff.hasMany(models.Appointment, {
        foreignKey: 'staff_id',
        as: 'appointments'
      });
      Staff.hasMany(models.Attendance, {
        foreignKey: 'staffId',
        as: 'attendance'
      });
    }
  }

  Staff.init({
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Full name is required'
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: {
        msg: 'Email already exists'
      },
      allowNull: false,
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address'
        }
      }
    },
    father_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Please provide a valid date of birth'
        }
      }
    },
    cnic: {
      type: DataTypes.STRING,
      unique: {
        msg: 'CNIC already exists'
      },
      allowNull: true
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: {
          args: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im,
          msg: 'Please provide a valid phone number'
        }
      }
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    experience: {
      type: DataTypes.STRING,
      allowNull: true
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Position is required'
        }
      }
    },
    joining_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Please provide a valid joining date'
        }
      }
    },
    leave_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Please provide a valid leave date'
        }
      }
    },
    initial_salary: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        isFloat: {
          msg: 'Please provide a valid salary amount'
        }
      }
    },
    commission_rate: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      validate: {
        isFloat: {
          msg: 'Please provide a valid commission rate'
        },
        min: {
          args: [0],
          msg: 'Commission rate cannot be negative'
        }
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Active',
      validate: {
        isIn: {
          args: [['Active', 'Inactive', 'Suspended', 'On Leave']],
          msg: 'Invalid status value'
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Password is required'
        },
        len: {
          args: [8, 128],
          msg: 'Password must be between 8 and 128 characters'
        }
      }
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Role is required'
        }
      }
    },
    performance_metrics: {
      type: DataTypes.JSON,
      defaultValue: {
        total_customers: 0,
        total_revenue: 0,
        total_commission: 0,
        average_rating: 0,
        attendance_rate: 0
      }
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Staff',
    timestamps: true,
    paranoid: true,
    defaultScope: {
      attributes: {
        exclude: ['password']
      }
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] }
      }
    }
  });

  return Staff;
};