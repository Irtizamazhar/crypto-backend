module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define("Appointment", {
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    appointment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "scheduled",
      validate: {
        isIn: [['scheduled', 'completed', 'cancelled', 'no-show']]
      }
    },
  }, {
    indexes: [
      {
        fields: ['customer_id']
      },
      {
        fields: ['staff_id']
      },
      {
        fields: ['appointment_date']
      },
      {
        fields: ['status']
      }
    ]
  });

  Appointment.associate = (models) => {
    Appointment.belongsTo(models.Customer, { 
      foreignKey: "customer_id",
      as: "customer"
    });
    Appointment.belongsTo(models.Staff, { 
      foreignKey: "staff_id",
      as: "staff"
    });
    Appointment.belongsTo(models.Service, { 
      foreignKey: "service_id",
      as: "service"
    });
  };

  return Appointment;
};