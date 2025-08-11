// models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  console.log('🔄 Loading DB from environment variable...');
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  console.log('✅ Using config file for DB connection...');
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      ...config,
      logging: false,
    }
  );
}

// Explicitly load models first (if associations depend on them)
const modelFiles = [
  'Customer.js',
  'Staff.js',
  'ConsumableUsage.js',
  'Sale.js',
  'SaleItem.js',
  'ParkedSale.js',
  'Attendance.js',
  'Payroll.js' // Added Payroll to explicit loading
];

modelFiles.forEach((file) => {
  const modelPath = path.join(__dirname, file);
  try {
    const model = require(modelPath)(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
    console.log(`✅ Loaded model: ${model.name}`);
  } catch (err) {
    console.error(`❌ Failed to load ${file}:`, err.message);
  }
});

// Load all other models dynamically (excluding explicitly loaded)
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file !== basename &&
      !modelFiles.includes(file) &&
      file.endsWith('.js') &&
      !file.endsWith('.test.js') &&
      !file.endsWith('.disabled.js')
    );
  })
  .forEach(file => {
    try {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      if (model && model.name) {
        db[model.name] = model;
        console.log(`✅ Loaded model: ${model.name}`);
      }
    } catch (err) {
      console.warn(`⚠️ Skipping model "${file}" due to error:`, err.message);
    }
  });

// Set up associations
Object.keys(db).forEach(modelName => {
  if (typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;