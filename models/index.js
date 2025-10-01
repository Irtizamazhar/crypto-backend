// models/index.js
'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Load config/config.json if present; otherwise allow URL/env only
let rawCfg = {};
try {
  const all = require(path.resolve(__dirname, '../config/config.json'));
  rawCfg = all[env] || {};
} catch (_) {
  rawCfg = {};
}

// Sequelize options — force camelCase columns to match your DB
const sequelizeOptions = {
  ...rawCfg,
  logging:
    rawCfg.logging !== undefined
      ? rawCfg.logging
      : (process.env.SEQ_LOG_SQL === '1' ? console.log : false),
  define: {
    ...(rawCfg.define || {}),
    underscored: false,     // 🔴 important: use camelCase column names
    freezeTableName: true,  // don't auto-pluralize
    timestamps: true,
  },
  timezone: rawCfg.timezone || '+00:00',
};

let sequelize;
if (rawCfg.use_env_variable) {
  sequelize = new Sequelize(process.env[rawCfg.use_env_variable], sequelizeOptions);
} else if (rawCfg.url) {
  sequelize = new Sequelize(rawCfg.url, sequelizeOptions);
} else {
  sequelize = new Sequelize(
    rawCfg.database,
    rawCfg.username,
    rawCfg.password,
    sequelizeOptions
  );
}

const db = {};

// Auto-load every model file in /models (except this file)
fs.readdirSync(__dirname)
  .filter((file) =>
    file !== basename &&
    file.toLowerCase().endsWith('.js') &&
    !file.toLowerCase().endsWith('.test.js') &&
    !file.toLowerCase().endsWith('.disabled.js')
  )
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    if (model && model.name) db[model.name] = model;
  });

// Wire up associations
Object.keys(db).forEach((name) => {
  if (typeof db[name].associate === 'function') db[name].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
