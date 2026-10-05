/**
 * ===========================================
 *  UserPreference Model Definition
 * ===========================================
 *
 * Defines the UserPreference table schema using Sequelize.
 * Matches the user_preferences migration. Stores one
 * preferences row per user.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

// -------------------------------------------------
//  Types & Interfaces
// -------------------------------------------------

/** All attributes on the UserPreference model */
export interface UserPreferenceAttributes {
  id: number;
  user_id: number;
  timezone: string | null;
  language: string;
  theme: 'light' | 'dark' | 'system';
  memory_enabled: boolean;
  concise_answers: boolean;
  daily_briefing_enabled: boolean;
  proactive_suggestions: boolean;
  in_app_notifications: boolean;
  browser_notifications: boolean;
  ai_preferences: object | null;
  created_at?: Date;
  updated_at?: Date;
}

/** Attributes optional when creating a new UserPreference */
interface UserPreferenceCreationAttributes extends Optional<UserPreferenceAttributes,
  'id' | 'timezone' | 'language' | 'theme' | 'memory_enabled' | 'concise_answers' | 'daily_briefing_enabled'
  | 'proactive_suggestions' | 'in_app_notifications' | 'browser_notifications' | 'ai_preferences' | 'created_at' | 'updated_at'
> { }

// -------------------------------------------------
//  Model Class
// -------------------------------------------------

/**
 * UserPreference model class extending Sequelize's Model.
 */
class UserPreference extends Model<UserPreferenceAttributes, UserPreferenceCreationAttributes> implements UserPreferenceAttributes {
  public id!: number;
  public user_id!: number;
  public timezone!: string | null;
  public language!: string;
  public theme!: 'light' | 'dark' | 'system';
  public memory_enabled!: boolean;
  public concise_answers!: boolean;
  public daily_briefing_enabled!: boolean;
  public proactive_suggestions!: boolean;
  public in_app_notifications!: boolean;
  public browser_notifications!: boolean;
  public ai_preferences!: object | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// -------------------------------------------------
//  Model Initialization
// -------------------------------------------------

UserPreference.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'Foreign key referencing users table (one preferences row per user)',
    },
    timezone: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
      comment: 'IANA timezone identifier of the user',
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'en',
      comment: 'Preferred language code',
    },
    theme: {
      type: DataTypes.ENUM('light', 'dark', 'system'),
      allowNull: false,
      defaultValue: 'system',
      comment: 'Preferred UI theme',
    },
    memory_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether memory features are enabled',
    },
    concise_answers: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the agent should prefer concise answers',
    },
    daily_briefing_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the daily briefing is enabled',
    },
    proactive_suggestions: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether proactive AI suggestions are enabled',
    },
    in_app_notifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether in-app notifications are enabled',
    },
    browser_notifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether browser notifications are enabled',
    },
    ai_preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Flexible AI preferences (e.g. model overrides)',
    },
  },
  {
    sequelize,
    tableName: 'user_preferences',
    timestamps: true,
    underscored: true,
  }
);

export default UserPreference;
