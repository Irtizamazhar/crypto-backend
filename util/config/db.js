const { Sequelize } = require('sequelize');
require('dotenv').config();

// ✅ Debug: Log all env values being used
console.log('--- Loaded Environment Variables ---');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_DIALECT:', process.env.DB_DIALECT);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('JWT_SECRET:', process.env.JWT_SECRET); // 🔒 Only for development
console.log('------------------------------------');

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT,
    logging: false,
  }
);

module.exports = sequelize;
