/**
 * ===========================================
 *  Memory Model Definition
 * ===========================================
 *
 * Defines the Memory table schema using Sequelize.
 * Matches the memories migration. Memories belong to
 * the owning user.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

// -------------------------------------------------
//  Types & Interfaces
// -------------------------------------------------

export type MemoryImportance = 'low' | 'medium' | 'high';

/** All attributes on the Memory model */
export interface MemoryAttributes {
  id: number;
  user_id: number;
  type: string;
  content: string;
  importance: MemoryImportance;
  source: string | null;
  created_at?: Date;
  updated_at?: Date;
}

/** Attributes optional when creating a new Memory */
interface MemoryCreationAttributes extends Optional<MemoryAttributes,
  'id' | 'type' | 'importance' | 'source' | 'created_at' | 'updated_at'
> { }

// -------------------------------------------------
//  Model Class
// -------------------------------------------------

/**
 * Memory model class extending Sequelize's Model.
 */
class Memory extends Model<MemoryAttributes, MemoryCreationAttributes> implements MemoryAttributes {
  public id!: number;
  public user_id!: number;
  public type!: string;
  public content!: string;
  public importance!: MemoryImportance;
  public source!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// -------------------------------------------------
//  Model Initialization
// -------------------------------------------------

Memory.init(
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
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'General',
      comment: 'Category/type of the memory (e.g. Preferences, Work, Important)',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'The memory content',
    },
    importance: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
      comment: 'Importance level of the memory',
    },
    source: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
      comment: 'Source of the memory (e.g. conversation, settings)',
    },
  },
  {
    sequelize,
    tableName: 'memories',
    timestamps: true,
    underscored: true,
  }
);

export default Memory;
