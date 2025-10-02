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

// 1) If config.json says "use_env_variable", honor it
if (rawCfg.use_env_variable) {
  sequelize = new Sequelize(process.env[rawCfg.use_env_variable], sequelizeOptions);

// 2) If a URL exists in config.json OR in env (DB_URL), use it
} else if (rawCfg.url || process.env.DB_URL) {
  const connUrl = rawCfg.url || process.env.DB_URL;
  sequelize = new Sequelize(connUrl, sequelizeOptions);

// 3) Otherwise, safely fall back to discrete env vars (DB_*). This prevents undefined init.
} else {
  const database = rawCfg.database || process.env.DB_NAME;
  const username = rawCfg.username || process.env.DB_USER;
  const password = rawCfg.password || process.env.DB_PASS;

  const host     = rawCfg.host     || process.env.DB_HOST || 'localhost';
  const port     = rawCfg.port     || Number(process.env.DB_PORT || 3306);
  const dialect  = rawCfg.dialect  || process.env.DB_DIALECT || 'mysql';

  // Guard: minimal checks so we don't init with missing critical fields
  if (!database || !username || (password === undefined && process.env.DB_PASS === undefined)) {
    throw new Error(
      'Sequelize config missing. Provide config/config.json or set DB_DIALECT, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS (or DB_URL).'
    );
  }

  sequelize = new Sequelize(
    database,
    username,
    password,
    {
      ...sequelizeOptions,
      host,
      port,
      dialect,
    }
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
