/**
 * ===========================================
 *  Sequelize CLI Database Configuration
 * ===========================================
 *
 * This file is used ONLY by sequelize-cli for running
 * migrations and seeders. It reads from .env and exports
 * the config in the format sequelize-cli expects
 * (environment-keyed object).
 *
 * NOTE: This is intentionally a .js file because
 * sequelize-cli requires a CommonJS config export.
 * The app itself uses config/database.ts for its
 * Sequelize instance.
 */

require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'novi_ai',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: console.log,
  },

  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'novi_ai',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: false,
  },

  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};
