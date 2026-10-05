/**
 * ===========================================
 *  Agent Model Definition
 * ===========================================
 *
 * Defines the Agent table schema using Sequelize.
 * Matches the agents migration. Every user owns
 * exactly one personal AI agent (default name "Novi").
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

// -------------------------------------------------
//  Types & Interfaces
// -------------------------------------------------

/** All attributes on the Agent model */
export interface AgentAttributes {
  id: number;
  user_id: number;
  name: string;
  personality: string | null;
  avatar: string | null;
  color: string | null;
  status: 'active' | 'inactive';
  created_at?: Date;
  updated_at?: Date;
}

/** Attributes optional when creating a new Agent */
interface AgentCreationAttributes extends Optional<AgentAttributes,
  'id' | 'personality' | 'avatar' | 'color' | 'status' | 'created_at' | 'updated_at'
> { }

// -------------------------------------------------
//  Model Class
// -------------------------------------------------

/**
 * Agent model class extending Sequelize's Model.
 */
class Agent extends Model<AgentAttributes, AgentCreationAttributes> implements AgentAttributes {
  public id!: number;
  public user_id!: number;
  public name!: string;
  public personality!: string | null;
  public avatar!: string | null;
  public color!: string | null;
  public status!: 'active' | 'inactive';

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// -------------------------------------------------
//  Model Initialization
// -------------------------------------------------

Agent.init(
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
      comment: 'Foreign key referencing users table (each user has one agent)',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Novi',
      comment: 'Display name of the agent (customizable by the user)',
    },
    personality: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: 'Agent personality / behavior configuration (system prompt overrides)',
    },
    avatar: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'orb',
      comment: 'Avatar key used by the frontend',
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: '#C26A44',
      comment: 'Accent color used by the frontend',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
      comment: 'Current agent status',
    },
  },
  {
    sequelize,
    tableName: 'agents',
    timestamps: true,
    underscored: true,
  }
);

export default Agent;
