/**
 * ===========================================
 *  Conversation Model Definition
 * ===========================================
 *
 * Defines the Conversation table schema using Sequelize.
 * Matches the conversations migration. Every conversation
 * belongs to exactly one user and one agent.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

// -------------------------------------------------
//  Types & Interfaces
// -------------------------------------------------

/** All attributes on the Conversation model */
export interface ConversationAttributes {
  id: number;
  user_id: number;
  agent_id: number;
  title: string;
  status: 'active' | 'archived';
  created_at?: Date;
  updated_at?: Date;
}

/** Attributes optional when creating a new Conversation */
interface ConversationCreationAttributes extends Optional<ConversationAttributes,
  'id' | 'title' | 'status' | 'created_at' | 'updated_at'
> { }

// -------------------------------------------------
//  Model Class
// -------------------------------------------------

/**
 * Conversation model class extending Sequelize's Model.
 */
class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  public id!: number;
  public user_id!: number;
  public agent_id!: number;
  public title!: string;
  public status!: 'active' | 'archived';

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// -------------------------------------------------
//  Model Initialization
// -------------------------------------------------

Conversation.init(
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
    agent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'agents',
        key: 'id',
      },
      comment: 'Foreign key referencing agents table (conversing agent)',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'New conversation',
      comment: 'Conversation title',
    },
    status: {
      type: DataTypes.ENUM('active', 'archived'),
      allowNull: false,
      defaultValue: 'active',
      comment: 'Current conversation status',
    },
  },
  {
    sequelize,
    tableName: 'conversations',
    timestamps: true,
    underscored: true,
  }
);

export default Conversation;
