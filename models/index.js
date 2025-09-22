// models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(path.resolve(__dirname, '../config/config.json'))[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], { ...config });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, { ...config });
}

// Load every model file in this folder except index.js
fs.readdirSync(__dirname)
  .filter((file) =>
    file !== basename &&
    file.toLowerCase().endsWith('.js') &&
    !file.toLowerCase().endsWith('.test.js') &&
    !file.toLowerCase().endsWith('.disabled.js')
  )
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    if (model && model.name) {
      db[model.name] = model;
      // console.log(`Loaded model: ${model.name}`);
    }
  });

// Hook up associations if any model defines them
Object.keys(db).forEach((name) => {
  if (typeof db[name].associate === 'function') {
    db[name].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
