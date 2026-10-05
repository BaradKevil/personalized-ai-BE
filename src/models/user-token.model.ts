/**
 * ===========================================
 *  UserToken Model Definition
 * ===========================================
 *
 * Defines the UserToken table schema using Sequelize.
 * Matches the user_tokens migration for managing auth tokens,
 * refresh tokens, password resets, and token revocation.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

// -------------------------------------------------
//  Types & Interfaces
// -------------------------------------------------

/** Allowed token types */
export type TokenType = 'refresh_token' | 'access_token' | 'reset_password' | 'email_verification';

/** All attributes on the UserToken model */
export interface UserTokenAttributes {
  id: number;
  user_id: number;
  token: string;
  type: TokenType;
  is_revoked: boolean;
  expires_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

/** Attributes optional when creating a new UserToken */
interface UserTokenCreationAttributes extends Optional<UserTokenAttributes,
  'id' | 'type' | 'is_revoked' | 'created_at' | 'updated_at'
> {}

// -------------------------------------------------
//  Model Class
// -------------------------------------------------

/**
 * UserToken model class extending Sequelize's Model.
 */
class UserToken extends Model<UserTokenAttributes, UserTokenCreationAttributes> implements UserTokenAttributes {
  public id!: number;
  public user_id!: number;
  public token!: string;
  public type!: TokenType;
  public is_revoked!: boolean;
  public expires_at!: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// -------------------------------------------------
//  Model Initialization
// -------------------------------------------------

UserToken.init(
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
      comment: 'Foreign key referencing users table',
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'JWT or secret token string',
    },
    type: {
      type: DataTypes.ENUM('refresh_token', 'access_token', 'reset_password', 'email_verification'),
      allowNull: false,
      defaultValue: 'refresh_token',
      comment: 'Type/purpose of the token',
    },
    is_revoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the token has been revoked/blacklisted',
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Token expiration timestamp',
    },
  },
  {
    sequelize,
    tableName: 'user_tokens',
    timestamps: true,
    underscored: true, // Maps createdAt -> created_at, updatedAt -> updated_at
  }
);

export default UserToken;
