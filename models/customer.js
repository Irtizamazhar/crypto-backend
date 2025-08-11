module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define("Customer", {
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    whatsapp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true, // e.g., walk-in, referral, etc.
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "customer",
    },
  });

  return Customer;
};
