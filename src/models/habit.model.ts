/**
 * ===========================================
 *  Habit Model Definition
 * ===========================================
 *
 * Defines the habits table schema using Sequelize.
 * Habits belong to the owning user and track a
 * repeatable behavior (daily or weekly).
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

// -------------------------------------------------
//  Types & Interfaces
// -------------------------------------------------

export type HabitFrequency = 'daily' | 'weekly';

/** All attributes on the Habit model */
export interface HabitAttributes {
  id: number;
  user_id: number;
  name: string;
  frequency: HabitFrequency;
  icon: string | null;
  color: string | null;
  created_at?: Date;
  updated_at?: Date;
}

/** Attributes optional when creating a new Habit */
interface HabitCreationAttributes extends Optional<HabitAttributes,
  'id' | 'frequency' | 'icon' | 'color' | 'created_at' | 'updated_at'
> { }

// -------------------------------------------------
//  Model Class
// -------------------------------------------------

/**
 * Habit model class extending Sequelize's Model.
 */
class Habit extends Model<HabitAttributes, HabitCreationAttributes> implements HabitAttributes {
  public id!: number;
  public user_id!: number;
  public name!: string;
  public frequency!: HabitFrequency;
  public icon!: string | null;
  public color!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// -------------------------------------------------
//  Model Initialization
// -------------------------------------------------

Habit.init(
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Name of the habit (e.g. Morning run)',
    },
    frequency: {
      type: DataTypes.ENUM('daily', 'weekly'),
      allowNull: false,
      defaultValue: 'daily',
      comment: 'How often the habit should be completed',
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
      comment: 'Optional icon name for the habit',
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
      comment: 'Optional accent color for the habit',
    },
  },
  {
    sequelize,
    tableName: 'habits',
    timestamps: true,
    underscored: true,
  }
);

export default Habit;
