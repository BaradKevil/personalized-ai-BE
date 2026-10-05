'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP — Creates the `goals` table.
   *
   * Goals belong to the owning user. Steps (milestones)
   * are stored as a JSON array on the goal row — the
   * frontend treats them as part of the goal object.
   *
   * Wrapped in a transaction so that if any step fails
   * (e.g., index creation), the entire table creation
   * is rolled back cleanly.
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'goals',
        {
          // -------------------------------------------------
          //  Primary Key
          // -------------------------------------------------
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            comment: 'Unique identifier for the goal',
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
          //  Goal Fields
          // -------------------------------------------------
          title: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'Short title of the goal',
          },

          description: {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null,
            comment: 'Optional description of the goal',
          },

          status: {
            type: Sequelize.ENUM('active', 'completed', 'archived'),
            allowNull: false,
            defaultValue: 'active',
            comment: 'Current goal status',
          },

          /** Progress percentage 0-100 */
          progress: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Progress percentage 0-100',
          },

          target_date: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: null,
            comment: 'Optional target completion date',
          },

          /** Milestones/steps as a JSON array [{id, text, done}] */
          steps: {
            type: Sequelize.JSON,
            allowNull: false,
            defaultValue: [],
            comment: 'Milestones/steps as a JSON array [{id, text, done}]',
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

      // Index on user_id for per-user goal queries
      await queryInterface.addIndex('goals', ['user_id'], {
        name: 'idx_goals_user_id',
        transaction,
      });

      // Index on user_id + status for status filtering
      await queryInterface.addIndex('goals', ['user_id', 'status'], {
        name: 'idx_goals_user_status',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * DOWN — Drops the `goals` table.
   *
   * Also wrapped in a transaction for safe rollback.
   */
  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('goals', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
