'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP — Creates the `tasks` table.
   *
   * Tasks belong to the owning user. Status follows the
   * lifecycle pending → in_progress → completed / cancelled.
   *
   * Wrapped in a transaction so that if any step fails
   * (e.g., index creation), the entire table creation
   * is rolled back cleanly.
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'tasks',
        {
          // -------------------------------------------------
          //  Primary Key
          // -------------------------------------------------
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            comment: 'Unique identifier for the task',
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
          //  Task Fields
          // -------------------------------------------------
          title: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'Short title of the task',
          },

          notes: {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null,
            comment: 'Optional notes or details for the task',
          },

          status: {
            type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
            comment: 'Current task status',
          },

          priority: {
            type: Sequelize.ENUM('low', 'medium', 'high'),
            allowNull: false,
            defaultValue: 'medium',
            comment: 'Task priority',
          },

          due_at: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: null,
            comment: 'Task due timestamp',
          },

          completed_at: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: null,
            comment: 'Timestamp when the task was completed',
          },

          /** Recurrence rule (none, daily, weekly, monthly) */
          recurrence: {
            type: Sequelize.STRING(20),
            allowNull: false,
            defaultValue: 'none',
            comment: 'Recurrence rule (none, daily, weekly, monthly)',
          },

          /** Free-form tags for organization */
          tags: {
            type: Sequelize.JSON,
            allowNull: false,
            defaultValue: [],
            comment: 'Free-form tags for organization',
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

      // Index on user_id for per-user task queries
      await queryInterface.addIndex('tasks', ['user_id'], {
        name: 'idx_tasks_user_id',
        transaction,
      });

      // Index on user_id + status for status filtering
      await queryInterface.addIndex('tasks', ['user_id', 'status'], {
        name: 'idx_tasks_user_status',
        transaction,
      });

      // Index on user_id + due_at for due-date queries
      await queryInterface.addIndex('tasks', ['user_id', 'due_at'], {
        name: 'idx_tasks_user_due_at',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * DOWN — Drops the `tasks` table.
   *
   * Also wrapped in a transaction for safe rollback.
   */
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('tasks', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
