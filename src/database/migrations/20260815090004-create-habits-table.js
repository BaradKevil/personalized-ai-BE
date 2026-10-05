'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * UP — Creates the `habits` table.
   *
   * Habits belong to the owning user and track a repeatable
   * behavior (daily or weekly).
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'habits',
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            comment: 'Unique identifier for the habit',
          },

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

          name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'Name of the habit (e.g. Morning run)',
          },

          frequency: {
            type: Sequelize.ENUM('daily', 'weekly'),
            allowNull: false,
            defaultValue: 'daily',
            comment: 'How often the habit should be completed',
          },

          icon: {
            type: Sequelize.STRING(50),
            allowNull: true,
            defaultValue: null,
            comment: 'Optional icon name for the habit',
          },

          color: {
            type: Sequelize.STRING(20),
            allowNull: true,
            defaultValue: null,
            comment: 'Optional accent color for the habit',
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

      await queryInterface.addIndex('habits', ['user_id'], {
        name: 'idx_habits_user_id',
        transaction,
      });

      await transaction.commit();
      console.log('✅ Migration applied: habits table created.');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * DOWN — Drops the `habits` table.
   */
  down: async (queryInterface) => {
    await queryInterface.dropTable('habits');
  },
};
