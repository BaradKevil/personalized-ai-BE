/**
 * ===========================================
 *  Task Model Definition
 * ===========================================
 *
 * Defines the Task table schema using Sequelize.
 * Matches the tasks migration. Tasks belong to the
 * owning user.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

// -------------------------------------------------
//  Types & Interfaces
// -------------------------------------------------

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

/** All attributes on the Task model */
export interface TaskAttributes {
  id: number;
  user_id: number;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: Date | null;
  completed_at: Date | null;
  recurrence: string;
  tags: string[];
  created_at?: Date;
  updated_at?: Date;
}

/** Attributes optional when creating a new Task */
interface TaskCreationAttributes extends Optional<TaskAttributes,
  'id' | 'notes' | 'status' | 'priority' | 'due_at' | 'completed_at' | 'recurrence' | 'tags' | 'created_at' | 'updated_at'
> { }

// -------------------------------------------------
//  Model Class
// -------------------------------------------------

/**
 * Task model class extending Sequelize's Model.
 */
class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: number;
  public user_id!: number;
  public title!: string;
  public notes!: string | null;
  public status!: TaskStatus;
  public priority!: TaskPriority;
  public due_at!: Date | null;
  public completed_at!: Date | null;
  public recurrence!: string;
  public tags!: string[];

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// -------------------------------------------------
//  Model Initialization
// -------------------------------------------------

Task.init(
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
      comment: 'Short title of the task',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: 'Optional notes or details for the task',
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Current task status',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
      comment: 'Task priority',
    },
    due_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Task due timestamp',
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Timestamp when the task was completed',
    },
    recurrence: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'none',
      comment: 'Recurrence rule (none, daily, weekly, monthly)',
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Free-form tags for organization',
    },
  },
  {
    sequelize,
    tableName: 'tasks',
    timestamps: true,
    underscored: true,
  }
);

export default Task;
