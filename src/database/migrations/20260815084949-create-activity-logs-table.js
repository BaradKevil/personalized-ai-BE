'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP — Creates the `activity_logs` table.
   *
   * Wrapped in a transaction to ensure atomicity —
   * if any step fails, the entire table creation is rolled back cleanly.
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'activity_logs',
        {
          // -------------------------------------------------
          //  Primary Key
          // -------------------------------------------------
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            comment: 'Unique identifier for the activity log entry',
          },

          // -------------------------------------------------
          //  Foreign Key — User Reference (Nullable for system/anon events)
          // -------------------------------------------------
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: null,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'Foreign key referencing users table (null if system or unauthenticated)',
          },

          // -------------------------------------------------
          //  Action & Details
          // -------------------------------------------------
          action_performed: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: 'Short action name/key (e.g. USER_LOGIN, USER_REGISTER, TASK_CREATED)',
          },

          ip_address: {
            type: Sequelize.STRING(45),
            allowNull: true,
            defaultValue: null,
            comment: 'IP address of the client (IPv4/IPv6 supported)',
          },

          description: {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null,
            comment: 'Additional details or message describing the activity',
          },

          status: {
            type: Sequelize.ENUM('success', 'failed', 'pending'),
            allowNull: false,
            defaultValue: 'success',
            comment: 'Execution status of the activity',
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

      // Add index on user_id for user activity history queries
      await queryInterface.addIndex('activity_logs', ['user_id'], {
        name: 'idx_activity_logs_user_id',
        transaction,
      });

      // Add index on action_performed for filtering by action type
      await queryInterface.addIndex('activity_logs', ['action_performed'], {
        name: 'idx_activity_logs_action_performed',
        transaction,
      });

      // Add index on status
      await queryInterface.addIndex('activity_logs', ['status'], {
        name: 'idx_activity_logs_status',
        transaction,
      });

      // Add index on created_at for time-range log queries
      await queryInterface.addIndex('activity_logs', ['created_at'], {
        name: 'idx_activity_logs_created_at',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * DOWN — Drops the `activity_logs` table.
   *
   * Also wrapped in a transaction for safe rollback.
   */
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('activity_logs', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
