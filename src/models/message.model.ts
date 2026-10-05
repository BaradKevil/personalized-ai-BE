/**
 * ===========================================
 *  Message Model Definition
 * ===========================================
 *
 * Defines the Message table schema using Sequelize.
 * Matches the messages migration. Every message belongs
 * to one conversation.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

// -------------------------------------------------
//  Types & Interfaces
// -------------------------------------------------

/** Allowed message roles */
export type MessageRole = 'user' | 'agent' | 'system' | 'tool';

/** All attributes on the Message model */
export interface MessageAttributes {
  id: number;
  conversation_id: number;
  user_id: number;
  role: MessageRole;
  content: string;
  metadata: object | null;
  created_at?: Date;
  updated_at?: Date;
}

/** Attributes optional when creating a new Message */
interface MessageCreationAttributes extends Optional<MessageAttributes,
  'id' | 'role' | 'metadata' | 'created_at' | 'updated_at'
> { }

// -------------------------------------------------
//  Model Class
// -------------------------------------------------

/**
 * Message model class extending Sequelize's Model.
 */
class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: number;
  public conversation_id!: number;
  public user_id!: number;
  public role!: MessageRole;
  public content!: string;
  public metadata!: object | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// -------------------------------------------------
//  Model Initialization
// -------------------------------------------------

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    conversation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id',
      },
      comment: 'Foreign key referencing conversations table',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'Foreign key referencing users table (message author)',
    },
    role: {
      type: DataTypes.ENUM('user', 'agent', 'system', 'tool'),
      allowNull: false,
      defaultValue: 'user',
      comment: 'Role of the message author',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Message content',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Structured metadata (e.g. AI actions or token usage)',
    },
  },
  {
    sequelize,
    tableName: 'messages',
    timestamps: true,
    underscored: true,
  }
);

export default Message;
