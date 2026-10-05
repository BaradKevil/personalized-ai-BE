/**
 * ===========================================
 *  ActivityLog Model Definition
 * ===========================================
 *
 * Defines the ActivityLog table schema using Sequelize.
 * Stores audit logs for user actions and system events.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

// -------------------------------------------------
//  Types & Interfaces
// -------------------------------------------------

export type ActivityLogStatus = 'success' | 'failed' | 'pending';

/** All attributes on the ActivityLog model */
export interface ActivityLogAttributes {
  id: number;
  user_id: number | null;
  action_performed: string;
  ip_address: string | null;
  description: string | null;
  status: ActivityLogStatus;
  created_at?: Date;
  updated_at?: Date;
}

/** Attributes optional when creating a new ActivityLog entry */
interface ActivityLogCreationAttributes extends Optional<ActivityLogAttributes,
  'id' | 'user_id' | 'ip_address' | 'description' | 'status' | 'created_at' | 'updated_at'
> {}

// -------------------------------------------------
//  Model Class
// -------------------------------------------------

class ActivityLog extends Model<ActivityLogAttributes, ActivityLogCreationAttributes> implements ActivityLogAttributes {
  public id!: number;
  public user_id!: number | null;
  public action_performed!: string;
  public ip_address!: string | null;
  public description!: string | null;
  public status!: ActivityLogStatus;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// -------------------------------------------------
//  Model Initialization
// -------------------------------------------------

ActivityLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'Foreign key referencing users table',
    },
    action_performed: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Short action name/key (e.g. USER_LOGIN, USER_REGISTER)',
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      defaultValue: null,
      comment: 'IP address of the client',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: 'Additional details or message describing the activity',
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'pending'),
      allowNull: false,
      defaultValue: 'success',
      comment: 'Execution status of the activity',
    },
  },
  {
    sequelize,
    tableName: 'activity_logs',
    timestamps: true,
    underscored: true,
  }
);

export default ActivityLog;
