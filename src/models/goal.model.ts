/**
 * ===========================================
 *  Goal Model Definition
 * ===========================================
 *
 * Defines the Goal table schema using Sequelize.
 * Matches the goals migration. Goals belong to the
 * owning user; steps (milestones) live as JSON.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

// -------------------------------------------------
//  Types & Interfaces
// -------------------------------------------------

export type GoalStatus = 'active' | 'completed' | 'archived';

/** A single milestone/step inside a goal */
export interface GoalStep {
  id: string;
  text: string;
  done: boolean;
}

/** All attributes on the Goal model */
export interface GoalAttributes {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: GoalStatus;
  progress: number;
  target_date: Date | null;
  steps: GoalStep[];
  created_at?: Date;
  updated_at?: Date;
}

/** Attributes optional when creating a new Goal */
interface GoalCreationAttributes extends Optional<GoalAttributes,
  'id' | 'description' | 'status' | 'progress' | 'target_date' | 'steps' | 'created_at' | 'updated_at'
> { }

// -------------------------------------------------
//  Model Class
// -------------------------------------------------

/**
 * Goal model class extending Sequelize's Model.
 */
class Goal extends Model<GoalAttributes, GoalCreationAttributes> implements GoalAttributes {
  public id!: number;
  public user_id!: number;
  public title!: string;
  public description!: string | null;
  public status!: GoalStatus;
  public progress!: number;
  public target_date!: Date | null;
  public steps!: GoalStep[];

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// -------------------------------------------------
//  Model Initialization
// -------------------------------------------------

Goal.init(
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Short title of the goal',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: 'Optional description of the goal',
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'archived'),
      allowNull: false,
      defaultValue: 'active',
      comment: 'Current goal status',
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
      comment: 'Progress percentage 0-100',
    },
    target_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Optional target completion date',
    },
    steps: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Milestones/steps as a JSON array [{id, text, done}]',
    },
  },
  {
    sequelize,
    tableName: 'goals',
    timestamps: true,
    underscored: true,
  }
);

export default Goal;
