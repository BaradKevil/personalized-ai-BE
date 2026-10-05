'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP — Creates the `notifications` table.
   *
   * Notifications belong to the owning user and cover
   * deadlines, reminders, AI suggestions, goals, and
   * system events.
   *
   * Wrapped in a transaction so that if any step fails
   * (e.g., index creation), the entire table creation
   * is rolled back cleanly.
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'notifications',
        {
          // -------------------------------------------------
          //  Primary Key
          // -------------------------------------------------
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            comment: 'Unique identifier for the notification',
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
            comment: 'Foreign key referencing users table (owning user)',
          },

          // -------------------------------------------------
          //  Notification Fields
          // -------------------------------------------------
          type: {
            type: Sequelize.ENUM('deadline', 'reminder', 'ai_suggestion', 'goal', 'system'),
            allowNull: false,
            defaultValue: 'system',
            comment: 'Type of the notification',
          },

          title: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'Notification title',
          },

          message: {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null,
            comment: 'Notification body message',
          },

          priority: {
            type: Sequelize.ENUM('low', 'medium', 'high'),
            allowNull: false,
            defaultValue: 'medium',
            comment: 'Notification priority',
          },

          read_at: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: null,
            comment: 'Timestamp when the notification was read (null = unread)',
          },

          /** Structured metadata (e.g. related task id) */
          metadata: {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: null,
            comment: 'Structured metadata (e.g. related task id)',
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

      // Index on user_id for per-user notification queries
      await queryInterface.addIndex('notifications', ['user_id'], {
        name: 'idx_notifications_user_id',
        transaction,
      });

      // Index on user_id + read_at for unread counts
      await queryInterface.addIndex('notifications', ['user_id', 'read_at'], {
        name: 'idx_notifications_user_read_at',
        transaction,
      });

      // Index on user_id + created_at for time-ordered listings
      await queryInterface.addIndex('notifications', ['user_id', 'created_at'], {
        name: 'idx_notifications_user_created',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * DOWN — Drops the `notifications` table.
   *
   * Also wrapped in a transaction for safe rollback.
   */
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('notifications', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
