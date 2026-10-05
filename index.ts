/**
 * ===========================================
 *  Novi Backend — Server Entry Point
 * ===========================================
 *
 * Bootstraps the server by:
 *  1. Importing the configured Express app
 *  2. Testing the database connection
 *  3. Starting the HTTP server on the configured port
 *
 * This file is the entry point for running the server.
 * The Express app configuration lives in app.ts, keeping
 * server startup concerns separate from app configuration.
 */

import app from './app';
import config from './config';
import { testConnection } from './config/database';

// -------------------------------------------------
//  Process-Level Crash Handlers
// -------------------------------------------------

/**
 * If an unexpected error escapes the app, log it clearly
 * (with stack) and exit with a non-zero code so the
 * process manager can restart cleanly — never continue
 * running in an undefined state.
 */
process.on('uncaughtException', (error) => {
  console.error('💥 [Fatal] Uncaught exception — shutting down.');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 [Fatal] Unhandled promise rejection — shutting down.');
  console.error(reason);
  process.exit(1);
});

// -------------------------------------------------
//  Start Server
// -------------------------------------------------

/**
 * Self-invoking async function to:
 *  1. Test the database connection
 *  2. Start listening on the configured port
 *
 * If the database connection fails, the server will NOT start
 * and the process will exit with code 1 (fail-fast approach).
 */
(async () => {
  try {
    // Attempt to connect to MySQL — throws if unreachable
    await testConnection();

    app.listen(config.port, () => {
      console.log(`\n🚀 Server is running on port ${config.port}`);
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    console.error('💀 Server not started — exiting process.');
    process.exit(1);
  }
})();
