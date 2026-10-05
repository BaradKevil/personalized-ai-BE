/**
 * ===========================================
 *  Habit Log Model Definition
 * ===========================================
 *
 * Defines the habit_logs table schema using Sequelize.
 * A single row means the habit was completed on that
 * calendar date. Unique on (habit_id, log_date).
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

// -------------------------------------------------
//  Types & Interfaces
// -------------------------------------------------

/** All attributes on the HabitLog model */
export interface HabitLogAttributes {
  id: number;
  habit_id: number;
  log_date: string;
  created_at?: Date;
}

/** Attributes optional when creating a new HabitLog */
interface HabitLogCreationAttributes extends Optional<HabitLogAttributes,
  'id' | 'created_at'
> { }

// -------------------------------------------------
//  Model Class
// -------------------------------------------------

/**
 * HabitLog model class extending Sequelize's Model.
 */
class HabitLog extends Model<HabitLogAttributes, HabitLogCreationAttributes> implements HabitLogAttributes {
  public id!: number;
  public habit_id!: number;
  public log_date!: string;

  public readonly created_at!: Date;
}

// -------------------------------------------------
//  Model Initialization
// -------------------------------------------------

HabitLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    habit_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'habits',
        key: 'id',
      },
      comment: 'Foreign key referencing habits table',
    },
    log_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Calendar date the habit was completed (YYYY-MM-DD)',
    },
  },
  {
    sequelize,
    tableName: 'habit_logs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['habit_id', 'log_date'],
        name: 'uq_habit_logs_habit_date',
      },
    ],
  }
);

export default HabitLog;
