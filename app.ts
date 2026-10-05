/**
 * ===========================================
 *  Express Application Configuration
 * ===========================================
 *
 * Creates and configures the Express application
 * with all middleware, routes, and error handling.
 *
 * This file does NOT start the server — it only
 * exports the configured app instance.
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler } from './src/middlewares/error.middleware';
import router from './src/routes';
import config from './config';

// -------------------------------------------------
//  Create Express Application
// -------------------------------------------------
const app: Application = express();

/** Trust proxy headers (X-Forwarded-For) for IP resolution */
app.set('trust proxy', true);

// -------------------------------------------------
//  Global Middleware Stack
// -------------------------------------------------

/** Security headers via Helmet */
app.use(helmet());

/**
 * CORS.
 *
 * - Development: any `localhost` / `127.0.0.1` origin is allowed on any port,
 *   because the Vite dev server picks a random port when 5173 is busy.
 * - Production: only the origins listed in CORS_ORIGIN are allowed.
 *
 * Never `*` when serving authenticated data.
 */
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (curl, health checks, same-origin calls)
      if (!origin) {
        return callback(null, true);
      }

      if (config.nodeEnv !== 'production') {
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        return callback(null, isLocalhost);
      }

      return callback(null, config.corsOrigins.includes(origin));
    },
    credentials: true,
  })
);

/** HTTP request logger — 'dev' format for concise colored output */
app.use(morgan('dev'));

/** Parse incoming JSON payloads */
app.use(express.json());

/** Parse URL-encoded form data */
app.use(express.urlencoded({ extended: true }));

// -------------------------------------------------
//  API Routes
// -------------------------------------------------

/** Mount all application routes under /api */
app.use('/api', router);

// -------------------------------------------------
//  Global Error Handler (must be registered last)
// -------------------------------------------------
app.use(errorHandler);

export default app;
