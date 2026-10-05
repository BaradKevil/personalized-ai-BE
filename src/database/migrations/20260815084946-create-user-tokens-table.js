'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP — Creates the `user_tokens` table.
   *
   * Wrapped in a transaction to ensure atomicity —
   * if any step fails (e.g., index or FK creation),
   * the entire migration is rolled back cleanly.
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'user_tokens',
        {
          // -------------------------------------------------
          //  Primary Key
          // -------------------------------------------------
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            comment: 'Unique identifier for the token record',
          },

          // -------------------------------------------------
          //  Foreign Key — User Reference
          // -------------------------------------------------
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Foreign key referencing users table',
          },

          // -------------------------------------------------
          //  Token Payload & Meta
          // -------------------------------------------------
          token: {
            type: Sequelize.STRING(500),
            allowNull: false,
            comment: 'JWT or secret token string',
          },

          type: {
            type: Sequelize.ENUM('refresh_token', 'access_token', 'reset_password', 'email_verification'),
            allowNull: false,
            defaultValue: 'refresh_token',
            comment: 'Type/purpose of the token',
          },

          is_revoked: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether the token has been revoked/blacklisted',
          },

          expires_at: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: 'Token expiration timestamp',
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

      // Index on user_id for fast user token lookup
      await queryInterface.addIndex('user_tokens', ['user_id'], {
        name: 'idx_user_tokens_user_id',
        transaction,
      });

      // Index on token string for fast verification
      await queryInterface.addIndex('user_tokens', ['token'], {
        name: 'idx_user_tokens_token',
        transaction,
      });

      // Index on type for filtering token types
      await queryInterface.addIndex('user_tokens', ['type'], {
        name: 'idx_user_tokens_type',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * DOWN — Drops the `user_tokens` table.
   *
   * Wrapped in a transaction for safe rollback.
   */
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('user_tokens', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
