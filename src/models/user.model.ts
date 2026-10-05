/**
 * ===========================================
 *  User Model Definition
 * ===========================================
 *
 * Defines the User table schema using Sequelize.
 * Matches the users migration with fields for profile,
 * authentication, and account status.
 *
 * Includes automatic password hashing via a
 * beforeCreate hook using bcryptjs.
 */

import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../../config/database';

// -------------------------------------------------
//  Interfaces
// -------------------------------------------------

/** All attributes on the User model */
export interface UserAttributes {
  id: number;
  full_name: string;
  email: string;
  mobile_number: string | null;
  password: string;
  timezone: string | null;
  avatar_color: string | null;
  status: 'active' | 'inactive' | 'suspended';
  last_login: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

/** Attributes that are optional when creating a new User */
interface UserCreationAttributes extends Optional<UserAttributes,
  'id' | 'mobile_number' | 'timezone' | 'avatar_color' | 'status' | 'last_login' | 'created_at' | 'updated_at'
> { }

// -------------------------------------------------
//  Model Class
// -------------------------------------------------

/**
 * User model class extending Sequelize's Model.
 * Provides instance methods for password comparison.
 */
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public full_name!: string;
  public email!: string;
  public mobile_number!: string | null;
  public password!: string;
  public timezone!: string | null;
  public avatar_color!: string | null;
  public status!: 'active' | 'inactive' | 'suspended';
  public last_login!: Date | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Compares a plain-text password against the hashed password
   * stored in the database.
   *
   * @param candidatePassword - The plain-text password to verify
   * @returns Promise<boolean> - True if passwords match
   */
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

// -------------------------------------------------
//  Model Initialization
// -------------------------------------------------

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Full name of the user',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      comment: 'Unique email address used for authentication',
    },
    mobile_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
      validate: {
        len: [8, 20],
      },
      comment: 'Mobile number of the user (used as an alternate login identifier)',
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Bcrypt-hashed password',
    },
    timezone: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
      comment: 'IANA timezone identifier of the user',
    },
    avatar_color: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
      comment: 'Accent color for the user avatar',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
      comment: 'Current account status',
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Timestamp of the last successful login',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,

    hooks: {
      /**
       * beforeCreate Hook:
       * Automatically hashes the user's password before
       * inserting the record into the database.
       */
      beforeCreate: async (user: User) => {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      },

      /**
       * beforeUpdate Hook:
       * Re-hashes the password only when it actually changed
       * (e.g. password reset), never on unrelated updates.
       */
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;
