/**
 * ===========================================
 *  Database Configuration & Connection
 * ===========================================
 *
 * Initializes a Sequelize instance configured for MySQL.
 * Provides a utility function to test the database connection.
 */

import { Sequelize } from 'sequelize';
import config from './index';

/**
 * Sequelize instance configured with MySQL credentials
 * from the centralized config module.
 *
 * Options:
 *  - dialect: MySQL
 *  - logging: Enabled only in development mode (logs raw SQL queries)
 *  - pool: Connection pool settings for performance optimization
 */
const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',

    // Only log SQL queries in development for debugging
    logging: config.nodeEnv === 'development' ? console.log : false,

    // Connection pool configuration
    pool: {
      max: 10,       // Maximum number of connections in pool
      min: 0,        // Minimum number of connections in pool
      acquire: 30000, // Max time (ms) to acquire a connection before throwing error
      idle: 10000,    // Max time (ms) a connection can be idle before being released
    },
  }
);

/**
 * Tests the database connection by attempting to authenticate.
 * Logs success on connection. Throws on failure so the caller
 * can decide how to handle it (e.g., exit the process).
 *
 * @returns Promise<void>
 * @throws Error if the database connection fails
 */
export const testConnection = async (): Promise<void> => {
  await sequelize.authenticate();
  console.log('✅ Database connection established successfully.');
};

export default sequelize;
