/**
 * ===========================================
 *  Notification Model Definition
 * ===========================================
 *
 * Defines the Notification table schema using Sequelize.
 * Matches the notifications migration. Notifications
 * belong to the owning user.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

// -------------------------------------------------
//  Types & Interfaces
// -------------------------------------------------

export type NotificationType = 'deadline' | 'reminder' | 'ai_suggestion' | 'goal' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high';

/** All attributes on the Notification model */
export interface NotificationAttributes {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string | null;
  priority: NotificationPriority;
  read_at: Date | null;
  metadata: object | null;
  created_at?: Date;
  updated_at?: Date;
}

/** Attributes optional when creating a new Notification */
interface NotificationCreationAttributes extends Optional<NotificationAttributes,
  'id' | 'type' | 'message' | 'priority' | 'read_at' | 'metadata' | 'created_at' | 'updated_at'
> { }

// -------------------------------------------------
//  Model Class
// -------------------------------------------------

/**
 * Notification model class extending Sequelize's Model.
 */
class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: number;
  public user_id!: number;
  public type!: NotificationType;
  public title!: string;
  public message!: string | null;
  public priority!: NotificationPriority;
  public read_at!: Date | null;
  public metadata!: object | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// -------------------------------------------------
//  Model Initialization
// -------------------------------------------------

Notification.init(
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
      comment: 'Foreign key referencing users table (owning user)',
    },
    type: {
      type: DataTypes.ENUM('deadline', 'reminder', 'ai_suggestion', 'goal', 'system'),
      allowNull: false,
      defaultValue: 'system',
      comment: 'Type of the notification',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Notification title',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: 'Notification body message',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
      comment: 'Notification priority',
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Timestamp when the notification was read (null = unread)',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Structured metadata (e.g. related task id)',
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
  }
);

export default Notification;
