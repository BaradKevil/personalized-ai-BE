'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP — Creates the `habit_logs` table.
   *
   * A single row means the habit was completed on that calendar
   * date. Unique on (habit_id, log_date) so a habit can only be
   * logged once per day.
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'habit_logs',
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            comment: 'Unique identifier for the habit log',
          },

          habit_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'habits',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Foreign key referencing habits table',
          },

          log_date: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            comment: 'Calendar date the habit was completed (YYYY-MM-DD)',
          },

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

      await queryInterface.addIndex('habit_logs', ['habit_id', 'log_date'], {
        name: 'uq_habit_logs_habit_date',
        unique: true,
        transaction,
      });

      await queryInterface.addIndex('habit_logs', ['habit_id'], {
        name: 'idx_habit_logs_habit_id',
        transaction,
      });

      await transaction.commit();
      console.log('✅ Migration applied: habit_logs table created.');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * DOWN — Drops the `habit_logs` table.
   */
  down: async (queryInterface) => {
    await queryInterface.dropTable('habit_logs');
  },
};
