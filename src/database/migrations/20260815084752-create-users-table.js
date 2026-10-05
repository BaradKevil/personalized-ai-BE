'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP — Creates the `users` table.
   *
   * Wrapped in a transaction so that if any step fails
   * (e.g., index creation), the entire table creation
   * is rolled back cleanly.
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'users',
        {
          // -------------------------------------------------
          //  Primary Key
          // -------------------------------------------------
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            comment: 'Unique identifier for the user',
          },

          // -------------------------------------------------
          //  User Profile Fields
          // -------------------------------------------------
          full_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'Full name of the user',
          },

          email: {
            type: Sequelize.STRING(255),
            allowNull: false,
            unique: true,
            comment: 'Unique email address used for authentication',
          },

          mobile_number: {
            type: Sequelize.STRING(20),
            allowNull: true,
            defaultValue: null,
            comment: 'Mobile number of the user (used as an alternate login identifier)',
          },

          /** Bcrypt-hashed password */
          password: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'Bcrypt-hashed password (never stored in plaintext)',
          },

          /** User timezone (IANA name, e.g. Asia/Kolkata) */
          timezone: {
            type: Sequelize.STRING(100),
            allowNull: true,
            defaultValue: null,
            comment: 'IANA timezone identifier of the user',
          },

          /** Accent color used for the user avatar in the frontend */
          avatar_color: {
            type: Sequelize.STRING(20),
            allowNull: true,
            defaultValue: null,
            comment: 'Accent color for the user avatar',
          },

          // -------------------------------------------------
          //  Account Status & Tracking
          // -------------------------------------------------

          /** Account status for soft-disabling accounts */
          status: {
            type: Sequelize.ENUM('active', 'inactive', 'suspended'),
            allowNull: false,
            defaultValue: 'active',
            comment: 'Current account status',
          },

          /** Timestamp of the user's most recent successful login */
          last_login: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: null,
            comment: 'Timestamp of the last successful login',
          },

          // -------------------------------------------------
          //  Timestamps
          // -------------------------------------------------
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            comment: 'Record creation timestamp',
          },

          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            comment: 'Record last update timestamp',
          },
        },
        { transaction }
      );

      // Index on email for fast auth lookups
      await queryInterface.addIndex('users', ['email'], {
        unique: true,
        name: 'idx_users_email_unique',
        transaction,
      });

      // Index on mobile_number for fast identifier lookups
      await queryInterface.addIndex('users', ['mobile_number'], {
        unique: true,
        name: 'idx_users_mobile_number_unique',
        transaction,
      });

      // Index on status for filtering active/inactive users
      await queryInterface.addIndex('users', ['status'], {
        name: 'idx_users_status',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * DOWN — Drops the `users` table.
   *
   * Also wrapped in a transaction for safe rollback.
   */
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('users', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
