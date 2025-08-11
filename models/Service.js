module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define("Service", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subCategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    commission: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    linkedProducts: {
      type: DataTypes.JSON, // [{ name: 'Shampoo', qty: 2 }]
      defaultValue: [],
    }
  });

  return Service;
};
