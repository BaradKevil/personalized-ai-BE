/**
 * ===========================================
 *  Centralized Configuration Module
 * ===========================================
 *
 * Loads environment variables from .env file and
 * exports a typed configuration object used
 * throughout the application.
 */

import dotenv from 'dotenv';

// Load environment variables from .env file into process.env
dotenv.config();

/**
 * Application configuration object.
 * All environment-dependent values are accessed through this object
 * to ensure a single source of truth.
 */
const config = {
  /** Server port — defaults to 3001 if not specified. `PORT=0` is treated as unset (some dev shells export it as "pick any port"). */
  port: (() => {
    const raw = parseInt(process.env.PORT || '', 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 3001;
  })(),

  /** Current environment (development | production | test) */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** Frontend URL used for building links back to the app */
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  /** Comma-separated list of allowed CORS origins */
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  /** Database configuration for Sequelize */
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'novi_ai',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },

  /** JWT configuration */
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_me',
    accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'default_access_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    resetSecret: process.env.JWT_RESET_SECRET || process.env.JWT_SECRET || 'default_reset_secret',
    resetExpiresIn: process.env.JWT_RESET_EXPIRES_IN || '15m',
  },

  /** AI provider configuration (Gemini / Groq / Mock) */
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini',
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: (() => {
      const model = process.env.GEMINI_MODEL || '';
      if (!model || model.startsWith('llama') || !model.includes('gemini')) {
        return 'gemini-flash-lite-latest';
      }
      return model;
    })(),
  },
};

export default config;
